import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Global, Injectable, Module } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env';

const safeName = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(-120);

/**
 * Credentials come from the EC2 instance role (no static keys on the server).
 * Leads bucket: private, SSE-S3, lifecycle rule deletes `tmp/` after 2 days.
 */
@Injectable()
export class S3Service {
  readonly client = new S3Client({ region: env().AWS_REGION });

  async presignLeadUpload(filename: string, contentType: string, size: number) {
    const key = `leads/tmp/${new Date().toISOString().slice(0, 10)}/${randomUUID()}/${safeName(filename)}`;
    const cmd = new PutObjectCommand({
      Bucket: env().S3_LEADS_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
      ServerSideEncryption: 'AES256',
    });
    const url = await getSignedUrl(this.client, cmd, { expiresIn: 600, signableHeaders: new Set(['content-type', 'content-length']) });
    return { key, url };
  }

  async exists(key: string, bucket = env().S3_LEADS_BUCKET) {
    try {
      const r = await this.client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return { ok: true, size: r.ContentLength ?? 0 };
    } catch {
      return { ok: false, size: 0 };
    }
  }

  presignDownload(key: string, filename: string) {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: env().S3_LEADS_BUCKET, Key: key, ResponseContentDisposition: `attachment; filename="${safeName(filename)}"` }),
      { expiresIn: 300 },
    );
  }

  async presignMediaUpload(filename: string, contentType: string, size: number) {
    const key = `media/${new Date().getUTCFullYear()}/${randomUUID().slice(0, 8)}-${safeName(filename)}`;
    const cmd = new PutObjectCommand({
      Bucket: env().S3_MEDIA_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
      CacheControl: 'public, max-age=31536000, immutable',
    });
    const url = await getSignedUrl(this.client, cmd, { expiresIn: 600, signableHeaders: new Set(['content-type', 'content-length']) });
    return { key, url, publicUrl: `${env().MEDIA_PUBLIC_URL.replace(/\/$/, '')}/${key}` };
  }

  delete(key: string, bucket = env().S3_LEADS_BUCKET) {
    return this.client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }
}

@Global()
@Module({ providers: [S3Service], exports: [S3Service] })
export class StorageModule {}
