import { Body, ConflictException, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AuthService } from '../auth/auth.service';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard, type AuthUser } from '../common/auth';
import { ZodPipe } from '../common/http';
import { PrismaService } from '../common/prisma.service';

const CreateUser = z.object({
  email: z.string().email(),
  name: z.string().max(120).optional(),
  role: z.enum(['ADMIN', 'EDITOR']).default('EDITOR'),
  password: z.string().min(12).max(200),
});
const UpdateUser = z.object({ name: z.string().max(120).optional(), role: z.enum(['ADMIN', 'EDITOR']).optional() });

@ApiTags('admin/users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, email: true, name: true, role: true, totpEnabled: true, lastLoginAt: true, createdAt: true },
    });
  }

  @Post()
  async create(@Body(new ZodPipe(CreateUser)) dto: z.infer<typeof CreateUser>) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (exists) throw new ConflictException('Email already in use');
    const u = await this.prisma.user.create({
      data: { email: dto.email.toLowerCase(), name: dto.name, role: dto.role, passwordHash: await AuthService.hashPassword(dto.password) },
    });
    return { id: u.id, email: u.email, role: u.role };
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(new ZodPipe(UpdateUser)) dto: z.infer<typeof UpdateUser>) {
    return this.prisma.user.update({ where: { id }, data: dto, select: { id: true, email: true, name: true, role: true } });
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @CurrentUser() me: AuthUser) {
    if (id === me.sub) throw new ConflictException('You cannot delete yourself');
    await this.prisma.user.delete({ where: { id } });
  }
}
