// Cloudflare Pages Function: /api/flags
// Requires a KV binding named FLAGS_KV bound to this Pages project

const DEFAULT_FLAGS = { trialLocked: false, arenaLocked: false };

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });
}

export async function onRequestGet({ env }) {
  try {
    const raw = await env.FLAGS_KV.get('flags');
    const flags = raw ? JSON.parse(raw) : DEFAULT_FLAGS;
    return jsonResponse({ success: true, data: flags });
  } catch (err) {
    return jsonResponse({ success: false, message: 'Failed to read flags' }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const password = body && body.password;
    if (password !== '1314520') {
      return jsonResponse({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const next = {
      trialLocked: Boolean(body && body.trialLocked),
      arenaLocked: Boolean(body && body.arenaLocked),
    };
    await env.FLAGS_KV.put('flags', JSON.stringify(next));
    return jsonResponse({ success: true, data: next });
  } catch (err) {
    return jsonResponse({ success: false, message: 'Failed to update flags' }, { status: 500 });
  }
}


