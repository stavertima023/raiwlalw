// Minimal shims to satisfy type checking in environments without Node types
declare const process: any;
declare const global: any;
declare function require(name: string): any;
// Import sharp lazily at runtime to avoid type resolution issues during build
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');
import { supabaseAdmin, supabaseStorageAdmin, supabaseStorageAdminServiceApikey, photoSupabaseStorageAdmin } from '@/lib/supabaseClient';

export type UploadedPhoto = {
  path: string;
  publicUrl: string;
};

const DEFAULT_BUCKET: string = (process.env.PHOTO_SUPABASE_BUCKET as string) || (process.env.SUPABASE_BUCKET as string) || 'order-images';

function pickStorageClient() {
  // Prefer dedicated photo storage Supabase client if provided
  return photoSupabaseStorageAdmin || supabaseStorageAdmin || supabaseStorageAdminServiceApikey || supabaseAdmin;
}

export async function ensureBucketPublic(bucketName: string = DEFAULT_BUCKET) {
  const client = pickStorageClient();
  if (!client) throw new Error('Supabase admin client not available');
  try {
    // Try create bucket (idempotent-ish): if exists, ignore error
    // @ts-ignore createBucket typing may vary
    const { error } = await client.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB per file
    });
    if (error && !String(error.message).toLowerCase().includes('already exists')) {
      // Ignore "Bucket already exists"; rethrow other errors
      throw error;
    }
    // Ensure it's public even if it already existed
    // @ts-ignore updateBucket typing may vary
    await client.storage.updateBucket(bucketName, { public: true });
  } catch (_) {
    // No-op if exists
  }
}

export function decodeBase64Image(base64: string): { buffer: any; contentType: string; ext: string } {
  const matches = base64.match(/^data:(.+);base64,(.*)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 image');
  }
  const contentType = matches[1];
  const data = matches[2];
  const buffer = (global as any).Buffer ? (global as any).Buffer.from(data, 'base64') : new Uint8Array([]);
  const ext = contentType.split('/')[1] || 'jpg';
  return { buffer, contentType, ext };
}

export async function uploadBase64ToStorage(options: {
  base64: string;
  orderId: string;
  seller?: string;
  index?: number;
  bucketName?: string;
}): Promise<UploadedPhoto> {
  const bucket = options.bucketName || DEFAULT_BUCKET;
  const { buffer, contentType } = decodeBase64Image(options.base64);
  const idPart = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  const date = new Date();
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const safeSeller = (options.seller || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${idPart}-${options.index ?? 0}.jpg`;
  const path = `orders/${y}/${m}/${d}/${safeSeller}/${options.orderId}/${filename}`;

  // Compress on server using sharp (cap dimensions and quality)
  let compressed: any;
  try {
    compressed = await sharp(buffer)
      .rotate()
      .resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: '4:4:4' })
      .toBuffer();
  } catch {
    // Fallback to original buffer if compression fails
    compressed = buffer as any;
  }

  // Supabase Storage fallback
  const primary = photoSupabaseStorageAdmin || supabaseStorageAdmin || supabaseAdmin;
  const secondary = supabaseStorageAdminServiceApikey || supabaseAdmin || photoSupabaseStorageAdmin;
  if (!primary && !secondary) throw new Error('Supabase admin client not available');
  await ensureBucketPublic(bucket);

  // Try primary (apikey=anon) first
  let { error: uploadError } = await (primary as any).storage
    .from(bucket)
    .upload(path, compressed, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: true,
    });
  // If unauthorized, retry with apikey=service
  if (uploadError && String(uploadError.message).toLowerCase().includes('invalid')) {
    if (secondary && secondary !== primary) {
      const retry = await (secondary as any).storage
        .from(bucket)
        .upload(path, compressed, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: true,
        });
      uploadError = retry.error;
      if (!uploadError) {
        const { data: publicUrlData } = (secondary as any).storage.from(bucket).getPublicUrl(path);
        return { path, publicUrl: publicUrlData.publicUrl };
      }
    }
  }
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = (primary as any).storage.from(bucket).getPublicUrl(path);
  const publicUrl = publicUrlData.publicUrl;
  return { path, publicUrl };
}

