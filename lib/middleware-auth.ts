const JWT_SECRET = process.env.JWT_SECRET;

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: "customer" | "admin";
  image: string | null;
};

function base64urlToBuffer(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 3 ? '=' : base64.length % 4 === 2 ? '==' : '';
  return Uint8Array.from(atob(base64 + pad), c => c.charCodeAt(0));
}

function bufferToHex(buf: Uint8Array): string {
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !JWT_SECRET) return null;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = base64urlToBuffer(parts[2]);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      encoder.encode(`${parts[0]}.${parts[1]}`)
    );

    if (!valid) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(base64urlToBuffer(parts[1]))
    );

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: payload.id || payload.userId,
      email: payload.email,
      name: payload.name || null,
      role: payload.role || 'customer',
      image: payload.image || null,
    };
  } catch {
    return null;
  }
}