// SPDX-License-Identifier: AGPL-3.0-or-later

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const expectedPassword = process.env.PASSWORD_HERE || process.env.VITE_GALLERY_PASSWORD || '';
  if (!expectedPassword) {
    return new Response(JSON.stringify({ error: 'Server password not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const data = (await req.json()) as { password?: string };
    const inputPassword = typeof data?.password === 'string' ? data.password : '';

    if (inputPassword === expectedPassword) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Incorrect password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config = {
  path: "/api/auth",
};
