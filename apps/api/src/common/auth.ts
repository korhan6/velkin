import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Role } from '@prisma/client';
import type { Request } from 'express';
import { env } from '../config/env';

export type AuthUser = { sub: string; email: string; role: Role; mfa?: boolean };
export type AuthedRequest = Request & { user?: AuthUser };

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<AuthedRequest>().user);

/** Validates the short-lived access token (Authorization: Bearer). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new UnauthorizedException();
    try {
      const payload = await this.jwt.verifyAsync<AuthUser & { typ?: string }>(token);
      if (payload.typ !== 'access') throw new Error('wrong token type');
      req.user = { sub: payload.sub, email: payload.email, role: payload.role, mfa: payload.mfa };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(ctx: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    const user = ctx.switchToHttp().getRequest<AuthedRequest>().user;
    // Admins must have enrolled 2FA before touching admin endpoints (they can still reach /auth/2fa/*).
    if (user?.role === 'ADMIN' && env().REQUIRE_2FA_FOR_ADMINS && !user.mfa) throw new ForbiddenException('2FA enrollment required');
    if (!roles?.length) return true;
    if (!user || !roles.includes(user.role)) throw new ForbiddenException();
    return true;
  }
}
