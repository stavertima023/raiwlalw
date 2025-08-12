import { NextResponse } from 'next/server';
import { supabaseStorageAdmin, supabaseStorageAdminServiceApikey, photoSupabaseStorageAdmin } from '@/lib/supabaseClient';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

async function tryFlow(label: string, client: any) {
  if (!client) {
    return { label, available: false, error: 'client is null' };
  }
  const result: any = { label, available: true };
  try {
    // List buckets to test auth
    const { data: buckets, error: listErr } = await client.storage.listBuckets();
    if (listErr) {
      result.listBuckets = { ok: false, error: stringifyErr(listErr) };
      return result;
    }
    result.listBuckets = { ok: true, count: buckets?.length ?? 0 };

    // Ensure bucket exists
    // @ts-ignore createBucket typing may vary
    const { error: createErr } = await client.storage.createBucket('order-photos', { public: true });
    if (createErr && !String(createErr.message).toLowerCase().includes('already exists')) {
      result.createBucket = { ok: false, error: stringifyErr(createErr) };
      return result;
    }
    result.createBucket = { ok: true };
    // @ts-ignore updateBucket typing may vary
    await client.storage.updateBucket('order-photos', { public: true });

    // Try tiny upload
    const content = Buffer.from('debug');
    const path = `__debug__/ping-${Date.now()}.txt`;
    const { error: uploadErr } = await client.storage
      .from('order-photos')
      .upload(path, content, { contentType: 'text/plain', upsert: true, cacheControl: '60' });
    if (uploadErr) {
      result.upload = { ok: false, error: stringifyErr(uploadErr) };
      return result;
    }
    const { data: publicUrlData } = client.storage.from('order-photos').getPublicUrl(path);
    result.upload = { ok: true, path, publicUrl: publicUrlData?.publicUrl };
    return result;
  } catch (e: any) {
    return { label, available: true, crash: stringifyErr(e) };
  }
}

function stringifyErr(e: any) {
  if (!e) return 'unknown';
  try {
    return JSON.stringify({ message: e.message, name: e.name, status: e.status, stack: e.stack });
  } catch (_) {
    return String(e);
  }
}

export async function GET() {
  const checks: any[] = [];
  checks.push(await tryFlow('primary(apikey=anon)', supabaseStorageAdmin));
  checks.push(await tryFlow('secondary(apikey=service)', supabaseStorageAdminServiceApikey));
  checks.push(await tryFlow('photo-storage (separate project)', photoSupabaseStorageAdmin));
  // S3 check
  try {
    if (process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
      const s3 = new S3Client({
        region: process.env.S3_REGION || 'us-east-1',
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: String(process.env.S3_FORCE_PATH_STYLE || 'true') === 'true',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
      });
      const res = await s3.send(new ListBucketsCommand({}));
      checks.push({ label: 's3', ok: true, buckets: (res.Buckets || []).map(b => b.Name) });
    } else {
      checks.push({ label: 's3', ok: false, reason: 'not configured' });
    }
  } catch (e: any) {
    checks.push({ label: 's3', ok: false, error: e?.message || String(e) });
  }
  return NextResponse.json({ ok: true, checks });
}

