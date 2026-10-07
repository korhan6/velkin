import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { JwtAuthGuard, Roles, RolesGuard } from '../common/auth';
import { clientCountry, clientIp } from '../common/http';
import { S3Service } from '../storage/s3.service';
import { CreateLeadDto, UpdateLeadDto, UploadRequestDto } from './leads.dto';
import { LeadsService } from './leads.service';

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService, private readonly s3: S3Service) {}

  /** Presigned PUT URL for one attachment (direct browser → S3 upload, never through the API). */
  @Post('uploads')
  @Throttle({ default: { limit: 15, ttl: 3_600_000 } })
  uploadUrl(@Body() dto: UploadRequestDto) {
    return this.s3.presignLeadUpload(dto.filename, dto.contentType, dto.size);
  }

  @Post()
  @Throttle({ default: { limit: 5, ttl: 600_000 } })
  create(@Body() dto: CreateLeadDto, @Req() req: Request) {
    return this.leads.create(dto, { ip: clientIp(req), ipCountry: clientCountry(req) });
  }
}

@ApiTags('admin/leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/leads')
export class LeadsAdminController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  list(
    @Query('status') status?: string,
    @Query('region') region?: string,
    @Query('country') country?: string,
    @Query('q') q?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.leads.list({ status, region, country, q, page, pageSize });
  }

  @Get('stats')
  stats(@Query('days') days?: number) {
    return this.leads.stats(Number(days) || 90);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.leads.get(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.leads.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.leads.remove(id);
  }
}
