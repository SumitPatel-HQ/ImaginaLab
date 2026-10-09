// SPDX-License-Identifier: AGPL-3.0-or-later

import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
  if (!privateKey) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'ImageKit private key not configured' }));
    return;
  }

  try {
    const urlObj = new URL(req.url || '', 'http://localhost');
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
    res.statusCode = response.status;
    res.setHeader('Content-Type', 'application/json');
    res.end(body);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch from ImageKit';
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: errorMessage }));
  }
}
