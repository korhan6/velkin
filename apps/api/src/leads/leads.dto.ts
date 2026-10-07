import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  Equals,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsISO8601,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const ALLOWED_TYPES = [
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream',
  'application/step',
  'model/step',
  'model/stl',
  'application/sla',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/vnd.dxf',
  'application/dxf',
  'image/vnd.dwg',
  'application/acad',
  'model/iges',
];
export const ALLOWED_EXT = /\.(step|stp|iges|igs|stl|dxf|dwg|pdf|zip|png|jpe?g|webp)$/i;
export const MAX_FILE = 50 * 1024 * 1024;

export class UploadRequestDto {
  @ApiProperty() @IsString() @Length(1, 200) @Matches(ALLOWED_EXT, { message: 'file type not allowed' }) filename: string;
  @ApiProperty() @IsString() @IsIn(ALLOWED_TYPES) contentType: string;
  @ApiProperty() @IsNumber() @Min(1) @Max(MAX_FILE) size: number;
}

export class AttachmentDto {
  @IsString() @Matches(/^leads\/tmp\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\/[\w.\-]+$/) key: string;
  @IsString() @Length(1, 200) filename: string;
  @IsString() @MaxLength(100) contentType: string;
  @IsNumber() @Min(1) @Max(MAX_FILE) size: number;
}

export class CreateLeadDto {
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(120) name: string;
  @ApiProperty() @IsEmail() @MaxLength(200) email: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160) company?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) jobTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @ApiProperty({ example: 'DE' }) @IsString() @Matches(/^[A-Z]{2}$/) country: string;
  @ApiProperty() @IsString() @MaxLength(60) projectType: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) industry?: string;
  @ApiProperty() @IsString() @MinLength(20) @MaxLength(8000) description: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(1e12) budgetAmount?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @Matches(/^[A-Z]{3}$/) budgetCurrency?: string;
  @ApiProperty() @IsBoolean() budgetUnsure: boolean;
  @ApiPropertyOptional({ enum: ['lt25', '25-100', '100-500', 'gt500', 'unsure'], description: 'USD-equivalent thousands' })
  @IsOptional()
  @IsIn(['lt25', '25-100', '100-500', 'gt500', 'unsure'])
  budgetRange?: string;
  @ApiProperty() @IsIn(['asap', '1-3m', '3-6m', '6m+', 'flexible']) timeline: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601({ strict: true }) preferredCallAt?: string | null;
  @ApiProperty() @IsString() @Matches(/^[a-z]{2}(-[A-Za-z]{2})?$/) locale: string;
  @ApiProperty({ example: 'Europe/Berlin' }) @IsString() @MaxLength(64) timezone: string;
  @ApiProperty() @Equals(true) consent: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() turnstileToken?: string | null;
  @ApiPropertyOptional({ description: 'Honeypot — must be empty' }) @IsOptional() @IsString() @MaxLength(0) website?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) source?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsObject() utm?: Record<string, string>;
  @ApiPropertyOptional({ type: [AttachmentDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}

export class UpdateLeadDto {
  @IsOptional() @IsIn(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST', 'SPAM']) status?: string;
  @IsOptional() @IsString() @MaxLength(10000) notes?: string;
}
