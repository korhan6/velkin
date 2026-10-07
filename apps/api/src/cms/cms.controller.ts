import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { z } from 'zod';
import { JwtAuthGuard, Roles, RolesGuard } from '../common/auth';
import { clientCountry, ZodPipe } from '../common/http';
import { normalizeLocale } from '../common/locale';
import { S3Service } from '../storage/s3.service';
import { DownloadSchema, isResource } from './cms.schemas';
import { CmsService } from './cms.service';

@ApiTags('public')
@Controller('public')
export class CmsPublicController {
  constructor(private readonly cms: CmsService) {}

  @Get('services')
  services(@Query('locale') locale?: string) {
    return this.cms.services(normalizeLocale(locale));
  }

  @Get('industries')
  industries(@Query('locale') locale?: string) {
    return this.cms.industries(normalizeLocale(locale));
  }

  @Get('projects')
  projects(@Query('locale') locale?: string) {
    return this.cms.projects(normalizeLocale(locale));
  }

  @Get('posts')
  posts(@Query('locale') locale?: string) {
    return this.cms.posts(normalizeLocale(locale));
  }

  @Get('resources')
  resources(@Query('locale') locale?: string) {
    return this.cms.resources(normalizeLocale(locale));
  }

  /** Returns the file URL and records the download (contact data only with explicit consent). */
  @Post('resources/:slug/download')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  download(@Param('slug') slug: string, @Body(new ZodPipe(DownloadSchema)) body: z.infer<typeof DownloadSchema>, @Req() req: Request) {
    return this.cms.download(slug, { ...body, locale: normalizeLocale(body.locale) }, clientCountry(req));
  }

  @Get('testimonials')
  testimonials(@Query('locale') locale?: string) {
    return this.cms.testimonials(normalizeLocale(locale));
  }

  @Get('certifications')
  certifications() {
    return this.cms.certifications();
  }

  @Get('team')
  team(@Query('locale') locale?: string) {
    return this.cms.team(normalizeLocale(locale));
  }

  @Get('clients')
  clients() {
    return this.cms.clients();
  }

  @Get('stats')
  async stats() {
    return (await this.cms.setting('stats')) ?? { projects: 0, countries: 0, years: 0, robots: 0 };
  }

  @Get('hero')
  async hero() {
    return (await this.cms.setting('hero')) ?? {};
  }
}

const MediaDto = z.object({
  filename: z.string().min(1).max(200).regex(/\.(png|jpe?g|webp|avif|svg|mp4|webm|pdf)$/i),
  contentType: z.enum(['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/svg+xml', 'video/mp4', 'video/webm', 'application/pdf']),
  size: z.number().int().min(1).max(200 * 1024 * 1024),
});

@ApiTags('admin/cms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class CmsAdminController {
  constructor(private readonly cms: CmsService, private readonly s3: S3Service) {}

  @Post('media/upload-url')
  media(@Body(new ZodPipe(MediaDto)) dto: z.infer<typeof MediaDto>) {
    return this.s3.presignMediaUpload(dto.filename, dto.contentType, dto.size);
  }

  @Get('downloads')
  downloads() {
    return this.cms.downloads();
  }

  @Put('settings/:key')
  setting(@Param('key') key: string, @Body() body: unknown) {
    return this.cms.putSetting(key, body);
  }

  @Get('settings/:key')
  async getSetting(@Param('key') key: string) {
    if (key !== 'stats' && key !== 'hero') throw new NotFoundException();
    return (await this.cms.setting(key)) ?? {};
  }

  @Get('cms/:resource')
  list(@Param('resource') r: string) {
    if (!isResource(r)) throw new NotFoundException();
    return this.cms.list(r);
  }

  @Get('cms/:resource/:id')
  get(@Param('resource') r: string, @Param('id') id: string) {
    if (!isResource(r)) throw new NotFoundException();
    return this.cms.get(r, id);
  }

  @Post('cms/:resource')
  create(@Param('resource') r: string, @Body() body: unknown) {
    if (!isResource(r)) throw new NotFoundException();
    return this.cms.create(r, body);
  }

  @Patch('cms/:resource/:id')
  update(@Param('resource') r: string, @Param('id') id: string, @Body() body: unknown) {
    if (!isResource(r)) throw new NotFoundException();
    return this.cms.update(r, id, body);
  }

  @Delete('cms/:resource/:id')
  @HttpCode(204)
  @Roles('ADMIN')
  remove(@Param('resource') r: string, @Param('id') id: string) {
    if (!isResource(r)) throw new NotFoundException();
    return this.cms.remove(r, id);
  }
}
