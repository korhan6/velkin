import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { PrismaService } from '../common/prisma.service';
import { env } from '../config/env';

authenticator.options = { window: 1 };

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export type Tokens = { accessToken: string; refreshToken: string; refreshExpires: Date };

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  static hashPassword(pw: string) {
    return bcrypt.hash(pw, 12);
  }

  publicUser(u: User) {
    return { id: u.id, email: u.email, name: u.name, role: u.role, totpEnabled: u.totpEnabled };
  }

  /** Step 1: password. Returns tokens, or an MFA challenge when 2FA is enabled. */
  async login(email: string, password: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    // constant-ish time: always run a bcrypt compare
    const ok = await bcrypt.compare(password, user?.passwordHash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
    if (!user || !ok) throw new UnauthorizedException('Invalid credentials');

    if (user.totpEnabled) {
      const mfaToken = await this.jwt.signAsync({ sub: user.id, typ: 'mfa' }, { expiresIn: 300 });
      return { mfaRequired: true as const, mfaToken };
    }
    return { mfaRequired: false as const, user, ...(await this.issue(user, userAgent)) };
  }

  /** Step 2: TOTP code for users with 2FA. */
  async verifyMfa(mfaToken: string, code: string, userAgent?: string) {
    let sub: string;
    try {
      const p = await this.jwt.verifyAsync<{ sub: string; typ: string }>(mfaToken);
      if (p.typ !== 'mfa') throw new Error();
      sub = p.sub;
    } catch {
      throw new UnauthorizedException('MFA session expired');
    }
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: sub } });
    if (!user.totpSecret || !authenticator.check(code, user.totpSecret)) throw new UnauthorizedException('Invalid code');
    return { user, ...(await this.issue(user, userAgent)) };
  }

  async issue(user: User, userAgent?: string, family: string = randomUUID()): Promise<Tokens> {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role, typ: 'access', mfa: user.totpEnabled },
      { expiresIn: env().JWT_ACCESS_TTL },
    );
    const refreshToken = randomBytes(48).toString('base64url');
    const refreshExpires = new Date(Date.now() + env().REFRESH_TTL_DAYS * 86400_000);
    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: sha256(refreshToken), family, expiresAt: refreshExpires, userAgent: userAgent?.slice(0, 250) },
    });
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return { accessToken, refreshToken, refreshExpires };
  }

  /** Rotating refresh tokens with reuse detection: a reused token revokes the whole family. */
  async refresh(refreshToken: string | undefined, userAgent?: string) {
    if (!refreshToken) throw new UnauthorizedException();
    const row = await this.prisma.refreshToken.findUnique({ where: { tokenHash: sha256(refreshToken) }, include: { user: true } });
    if (!row) throw new UnauthorizedException();
    if (row.revokedAt) {
      await this.prisma.refreshToken.updateMany({ where: { family: row.family, revokedAt: null }, data: { revokedAt: new Date() } });
      throw new UnauthorizedException('Token reuse detected');
    }
    if (row.expiresAt < new Date()) throw new UnauthorizedException();
    await this.prisma.refreshToken.update({ where: { id: row.id }, data: { revokedAt: new Date() } });
    return { user: row.user, ...(await this.issue(row.user, userAgent, row.family)) };
  }

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) return;
    const row = await this.prisma.refreshToken.findUnique({ where: { tokenHash: sha256(refreshToken) } });
    if (row) await this.prisma.refreshToken.updateMany({ where: { family: row.family, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  async me(userId: string) {
    const u = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const mustEnroll2fa = env().REQUIRE_2FA_FOR_ADMINS && u.role === 'ADMIN' && !u.totpEnabled;
    return { ...this.publicUser(u), mustEnroll2fa };
  }

  async setup2fa(userId: string) {
    const u = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (u.totpEnabled) throw new BadRequestException('2FA already enabled');
    const secret = authenticator.generateSecret();
    await this.prisma.user.update({ where: { id: userId }, data: { totpSecret: secret } });
    const otpauth = authenticator.keyuri(u.email, 'Velkin Admin', secret);
    return { otpauth, qr: await QRCode.toDataURL(otpauth), secret };
  }

  async enable2fa(userId: string, code: string) {
    const u = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!u.totpSecret || !authenticator.check(code, u.totpSecret)) throw new BadRequestException('Invalid code');
    await this.prisma.user.update({ where: { id: userId }, data: { totpEnabled: true } });
    return { ok: true };
  }

  async disable2fa(userId: string, code: string) {
    const u = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (env().REQUIRE_2FA_FOR_ADMINS && u.role === 'ADMIN') throw new ForbiddenException('2FA is mandatory for admins');
    if (!u.totpSecret || !authenticator.check(code, u.totpSecret)) throw new BadRequestException('Invalid code');
    await this.prisma.user.update({ where: { id: userId }, data: { totpEnabled: false, totpSecret: null } });
    return { ok: true };
  }

  async changePassword(userId: string, current: string, next: string) {
    const u = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await bcrypt.compare(current, u.passwordHash))) throw new BadRequestException('Wrong password');
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await AuthService.hashPassword(next) } });
    await this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    return { ok: true };
  }
}
