import { supabaseAdmin } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export type UploadedPhoto = {
  path: string;
  publicUrl: string;
};

const DEFAULT_BUCKET = 'order-photos';

export async function ensureBucketPublic(bucketName: string = DEFAULT_BUCKET) {
  if (!supabaseAdmin) throw new Error('Supabase admin client not available');
  try {
    // Try create bucket (idempotent-ish): if exists, ignore error
    // @ts-ignore createBucket typing may vary
    const { error } = await supabaseAdmin.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB per file
    });
    if (error && !String(error.message).toLowerCase().includes('already exists')) {
      // Ignore "Bucket already exists"; rethrow other errors
      throw error;
    }
  } catch (_) {
    // No-op if exists
  }
}

export function decodeBase64Image(base64: string): { buffer: Buffer; contentType: string; ext: string } {
  const matches = base64.match(/^data:(.+);base64,(.*)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 image');
  }
  const contentType = matches[1];
  const data = matches[2];
  const buffer = Buffer.from(data, 'base64');
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
  if (!supabaseAdmin) throw new Error('Supabase admin client not available');
  const bucket = options.bucketName || DEFAULT_BUCKET;
  await ensureBucketPublic(bucket);

  const { buffer, contentType, ext } = decodeBase64Image(options.base64);
  const idPart = uuidv4();
  const date = new Date();
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const safeSeller = (options.seller || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${idPart}-${options.index ?? 0}.${ext}`;
  const path = `orders/${y}/${m}/${d}/${safeSeller}/${options.orderId}/${filename}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType,
      cacheControl: '3600',
      upsert: true,
    });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  const publicUrl = publicUrlData.publicUrl;
  return { path, publicUrl };
}

