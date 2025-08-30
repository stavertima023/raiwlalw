// Minimal shims to satisfy type checking in environments without Node types
declare const process: { env: Record<string, string | undefined> };
declare const global: { Buffer?: typeof Buffer };

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
    // @ts-expect-error createBucket typing may vary
    const { error } = await client.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB per file
    });
    if (error && !String(error.message).toLowerCase().includes('already exists')) {
      // Ignore "Bucket already exists"; rethrow other errors
      throw error;
    }
    // Ensure it's public even if it already existed
    // @ts-expect-error updateBucket typing may vary
    await client.storage.updateBucket(bucketName, { public: true });
  } catch {
    // No-op if exists
  }
}

export function decodeBase64Image(base64: string): { buffer: Buffer | Uint8Array; contentType: string; ext: string } {
  const matches = base64.match(/^data:(.+);base64,(.*)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 image');
  }
  const contentType = matches[1];
  const data = matches[2];
  const buffer = (global as { Buffer?: typeof Buffer }).Buffer ? Buffer.from(data, 'base64') : new Uint8Array([]);
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
  const { buffer, contentType, ext } = decodeBase64Image(options.base64);
  const idPart = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  const date = new Date();
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const safeSeller = (options.seller || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${idPart}-${options.index ?? 0}.${ext}`;
  const path = `orders/${y}/${m}/${d}/${safeSeller}/${options.orderId}/${filename}`;

  // Supabase Storage fallback
  const primary = photoSupabaseStorageAdmin || supabaseStorageAdmin || supabaseAdmin;
  const secondary = supabaseStorageAdminServiceApikey || supabaseAdmin || photoSupabaseStorageAdmin;
  if (!primary && !secondary) throw new Error('Supabase admin client not available');
  await ensureBucketPublic(bucket);

  // Try primary (apikey=anon) first
  let { error: uploadError } = await (primary as { storage: { from: (bucket: string) => { upload: (path: string, buffer: Buffer | Uint8Array, options: any) => Promise<{ error: any }> } } }).storage
    .from(bucket)
    .upload(path, buffer, {
      contentType,
      cacheControl: '3600',
      upsert: true,
    });
  // If unauthorized, retry with apikey=service
  if (uploadError && String(uploadError.message).toLowerCase().includes('invalid')) {
    if (secondary && secondary !== primary) {
      const retry = await (secondary as { storage: { from: (bucket: string) => { upload: (path: string, buffer: Buffer | Uint8Array, options: any) => Promise<{ error: any }> } } }).storage
        .from(bucket)
        .upload(path, buffer, {
          contentType,
          cacheControl: '3600',
          upsert: true,
        });
      uploadError = retry.error;
      if (!uploadError) {
        const { data: publicUrlData } = (secondary as { storage: { from: (bucket: string) => { getPublicUrl: (path: string) => { data: { publicUrl: string } } } } }).storage.from(bucket).getPublicUrl(path);
        return { path, publicUrl: publicUrlData.publicUrl };
      }
    }
  }
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = (primary as { storage: { from: (bucket: string) => { getPublicUrl: (path: string) => { data: { publicUrl: string } } } } }).storage.from(bucket).getPublicUrl(path);
  const publicUrl = publicUrlData.publicUrl;
  return { path, publicUrl };
}

