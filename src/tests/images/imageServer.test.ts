import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../api/server';

function png1x1() {
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
  return Buffer.from(base64, 'base64');
}

describe('Image Upload API', () => {
  it('uploads a PNG under 5MB', async () => {
    const res = await request(app)
      .post('/api/images')
      .set('Authorization', 'Bearer test-token')
      .attach('file', png1x1(), { filename: 'tiny.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('url');
  });

  it('rejects unsupported format', async () => {
    const res = await request(app)
      .post('/api/images')
      .set('Authorization', 'Bearer test-token')
      .attach('file', Buffer.from('not an image'), { filename: 'x.txt', contentType: 'text/plain' });
    expect([400, 413, 500]).toContain(res.status);
  });

  it('serves uploaded file statically', async () => {
    const up = await request(app)
      .post('/api/images')
      .set('Authorization', 'Bearer test-token')
      .attach('file', png1x1(), { filename: 'tiny2.png', contentType: 'image/png' });
    const url = up.body.url as string;
    const get = await request(app).get(url);
    expect(get.status).toBe(200);
    expect(get.headers['content-type']).toMatch(/image\/png|image\/jpeg|image\/svg\+xml/);
  });
});
