import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { CurrentUser, JwtAuthGuard, type AuthUser } from '../common/auth';
import { ZodPipe } from '../common/http';
import { env } from '../config/env';
import { AuthService, type Tokens } from './auth.service';

const COOKIE = 'vk_rt';
const LoginDto = z.object({ email: z.string().email(), password: z.string().min(8).max(200) });
const MfaDto = z.object({ mfaToken: z.string(), code: z.string().regex(/^\d{6}$/) });
const CodeDto = z.object({ code: z.string().regex(/^\d{6}$/) });
const PasswordDto = z.object({ current: z.string(), next: z.string().min(12).max(200) });

function setRefreshCookie(res: Response, t: Tokens) {
  res.cookie(COOKIE, t.refreshToken, {
    httpOnly: true,
    secure: env().NODE_ENV === 'production',
    sameSite: 'lax', // api.* and admin.* are same-site
    domain: env().COOKIE_DOMAIN || undefined,
    path: '/v1/auth',
    expires: t.refreshExpires,
  });
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body(new ZodPipe(LoginDto)) dto: z.infer<typeof LoginDto>, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const r = await this.auth.login(dto.email, dto.password, req.headers['user-agent']);
    if (r.mfaRequired) return { mfaRequired: true, mfaToken: r.mfaToken };
    setRefreshCookie(res, r);
    return { mfaRequired: false, accessToken: r.accessToken, user: this.auth.publicUser(r.user) };
  }

  @Post('2fa/verify')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async verify(@Body(new ZodPipe(MfaDto)) dto: z.infer<typeof MfaDto>, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const r = await this.auth.verifyMfa(dto.mfaToken, dto.code, req.headers['user-agent']);
    setRefreshCookie(res, r);
    return { accessToken: r.accessToken, user: this.auth.publicUser(r.user) };
  }

  @Post('refresh')
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const r = await this.auth.refresh(req.cookies?.[COOKIE], req.headers['user-agent']);
    setRefreshCookie(res, r);
    return { accessToken: r.accessToken, user: this.auth.publicUser(r.user) };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[COOKIE]);
    res.clearCookie(COOKIE, { path: '/v1/auth', domain: env().COOKIE_DOMAIN || undefined });
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.sub);
  }

  @Post('2fa/setup')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  setup(@CurrentUser() user: AuthUser) {
    return this.auth.setup2fa(user.sub);
  }

  @Post('2fa/enable')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  enable(@CurrentUser() user: AuthUser, @Body(new ZodPipe(CodeDto)) dto: z.infer<typeof CodeDto>) {
    return this.auth.enable2fa(user.sub, dto.code);
  }

  @Post('2fa/disable')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  disable(@CurrentUser() user: AuthUser, @Body(new ZodPipe(CodeDto)) dto: z.infer<typeof CodeDto>) {
    return this.auth.disable2fa(user.sub, dto.code);
  }

  @Post('password')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  password(@CurrentUser() user: AuthUser, @Body(new ZodPipe(PasswordDto)) dto: z.infer<typeof PasswordDto>) {
    return this.auth.changePassword(user.sub, dto.current, dto.next);
  }
}
