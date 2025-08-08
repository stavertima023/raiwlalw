import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { uploadBase64ToStorage } from '@/lib/storage';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// Admin-only endpoint to migrate existing base64 photos to Supabase Storage
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });

    const session = await getSession();
    if (!session.isLoggedIn || session.user?.role !== 'Администратор') {
      return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
    }

    const { batchSize = 50 } = (await request.json().catch(() => ({}))) || {};

    // Find orders where photos contain base64 (heuristic: data:) and limited batch
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('id, seller, photos')
      .limit(batchSize);
    if (error) throw error;

    const migrated: { id: string; before: number; after: number }[] = [];

    for (const o of orders || []) {
      const photos: string[] = Array.isArray(o.photos) ? o.photos : [];
      if (photos.length === 0) continue;
      const looksBase64 = photos.some((p) => typeof p === 'string' && p.startsWith('data:'));
      if (!looksBase64) continue;

      const uploadedUrls: string[] = [];
      let idx = 0;
      for (const p of photos) {
        try {
          if (typeof p === 'string' && p.startsWith('data:')) {
            const res = await uploadBase64ToStorage({ base64: p, orderId: o.id, seller: o.seller || 'unknown', index: idx });
            uploadedUrls.push(res.publicUrl);
            idx += 1;
          } else if (typeof p === 'string') {
            uploadedUrls.push(p);
          }
        } catch (e) {
          console.warn('Migration failed for order', o.id, e);
        }
      }
      if (uploadedUrls.length > 0) {
        const { error: updErr } = await supabaseAdmin
          .from('orders')
          .update({ photos: uploadedUrls })
          .eq('id', o.id);
        if (updErr) throw updErr;
        migrated.push({ id: o.id, before: photos.length, after: uploadedUrls.length });
      }
    }

    return NextResponse.json({ migratedCount: migrated.length, migrated });
  } catch (error: any) {
    return NextResponse.json({ message: 'Ошибка миграции', error: error.message }, { status: 500 });
  }
}

