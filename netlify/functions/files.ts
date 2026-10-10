// SPDX-License-Identifier: AGPL-3.0-or-later

export default async (req: Request) => {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
  if (!privateKey) {
    return new Response(JSON.stringify({ error: 'ImageKit private key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const urlObj = new URL(req.url);
    const queryString = urlObj.search;
    const targetUrl = `https://api.imagekit.io/v1/files${queryString}`;
    const authHeader = `Basic ${Buffer.from(`${privateKey}:`).toString('base64')}`;

    const response = await fetch(targetUrl, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    const body = await response.text();
    return new Response(body, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch from ImageKit';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config = {
  path: "/api/files",
};
