import ngrok from 'ngrok';
import http from 'http';

async function getExistingTunnelUrl() {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:4040/api/tunnels', (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const httpsTunnel = json.tunnels?.find((t) => t.public_url?.startsWith('https://'));
          resolve(httpsTunnel?.public_url || null);
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

export async function initTunnel() {
  // 1. Respect explicit env override
  if (process.env.WEBHOOK_BASE_URL) return process.env.WEBHOOK_BASE_URL;

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) throw new Error('WEBHOOK_BASE_URL must be set in production');

  // 2. Cache within process
  if (global._cachedNgrokUrl) return global._cachedNgrokUrl;

  // 3. Re-use CLI tunnel if developer already started one manually
  const existing = await getExistingTunnelUrl();
  if (existing) {
    console.log('🔗  Reusing existing ngrok tunnel →', existing);
    global._cachedNgrokUrl = existing;
    return existing;
  }

  // 4. Otherwise start a fresh tunnel
  try {
    const url = await ngrok.connect({
      addr: 3000,
      authtoken: process.env.NGROK_AUTH_TOKEN,
    });
    console.log('🚇  ngrok tunnel started →', url);
    global._cachedNgrokUrl = url;
    return url;
  } catch (err) {
    console.error('❌  ngrok tunnel failed:', err?.body || err?.message || err);
    throw err;
  }
} 