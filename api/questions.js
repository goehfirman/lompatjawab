import { kv } from '@vercel/kv';

const KV_KEY = 'lompat_pilih_question_sets_v1';

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Check whether Vercel KV or Upstash Redis environment variables are available
  const isKvConfigured = !!(
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  );

  if (!isKvConfigured) {
    return res.status(200).json({
      success: false,
      configured: false,
      message: 'Vercel KV belum terhubung di Dashboard Vercel (Storage -> KV / Redis).',
      data: []
    });
  }

  try {
    if (req.method === 'GET') {
      const sets = await kv.get(KV_KEY);
      return res.status(200).json({
        success: true,
        configured: true,
        data: Array.isArray(sets) ? sets : []
      });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { set, sets } = body;

      if (Array.isArray(sets)) {
        await kv.set(KV_KEY, sets);
        return res.status(200).json({
          success: true,
          configured: true,
          message: 'Semua set kuis berhasil disinkronkan.',
          data: sets
        });
      }

      if (set && set.id) {
        let existing = await kv.get(KV_KEY);
        if (!Array.isArray(existing)) existing = [];

        const idx = existing.findIndex(s => s.id === set.id);
        if (idx >= 0) {
          existing[idx] = set;
        } else {
          existing.push(set);
        }

        await kv.set(KV_KEY, existing);
        return res.status(200).json({
          success: true,
          configured: true,
          data: existing
        });
      }

      return res.status(400).json({ success: false, error: 'Data set atau sets diperlukan.' });
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ success: false, error: 'Parameter id diperlukan.' });
      }

      let existing = await kv.get(KV_KEY);
      if (!Array.isArray(existing)) existing = [];

      const filtered = existing.filter(s => s.id !== String(id));
      await kv.set(KV_KEY, filtered);

      return res.status(200).json({
        success: true,
        configured: true,
        message: 'Set soal berhasil dihapus dari KV.',
        data: filtered
      });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (err) {
    console.error('Vercel KV Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Gagal berkomunikasi dengan Vercel KV'
    });
  }
}
