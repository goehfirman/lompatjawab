/**
 * Frontend client service for interacting with Vercel Serverless KV API (/api/questions)
 */

export async function fetchQuestionSetsFromVercel() {
  try {
    const res = await fetch('/api/questions');
    if (!res.ok) {
      // If 404 or not running on Vercel
      return { success: false, configured: false, data: null };
    }
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('Vercel API not reachable (running locally or offline):', err.message);
    return { success: false, configured: false, data: null };
  }
}

export async function saveQuestionSetToVercel(set) {
  try {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ set })
    });
    if (!res.ok) return false;
    const json = await res.json();
    return json.success;
  } catch (err) {
    console.warn('Failed to sync question set to Vercel KV:', err.message);
    return false;
  }
}

export async function deleteQuestionSetFromVercel(setId) {
  try {
    const res = await fetch(`/api/questions?id=${encodeURIComponent(setId)}`, {
      method: 'DELETE'
    });
    if (!res.ok) return false;
    const json = await res.json();
    return json.success;
  } catch (err) {
    console.warn('Failed to delete question set from Vercel KV:', err.message);
    return false;
  }
}

export async function uploadAllSetsToVercel(sets) {
  try {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sets })
    });
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || 'Gagal menyimpan ke Vercel KV');
    }
    return json;
  } catch (err) {
    console.error('Failed to batch upload sets to Vercel KV:', err);
    throw err;
  }
}
