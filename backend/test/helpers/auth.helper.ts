import request from 'supertest';
import { INestApplication } from '@nestjs/common';

interface RegisterResult {
  body: any;
  refreshCookie: string;
}

/**
 * Extracts the refresh_token cookie string from set-cookie headers.
 */
function extractRefreshCookie(headers: any): string {
  const cookies = headers['set-cookie'];
  if (!cookies) return '';
  const arr = Array.isArray(cookies) ? cookies : [cookies];
  const found = arr.find((c: string) => c.startsWith('refresh_token='));
  return found || '';
}

/**
 * Registers a new user via the /auth/register endpoint.
 * Returns body + refresh token cookie (no longer in body).
 */
export async function registerUser(
  app: INestApplication,
  overrides: Partial<{ email: string; password: string; name: string; orgName: string }> = {},
): Promise<RegisterResult> {
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      email: overrides.email ?? 'test@example.com',
      password: overrides.password ?? 'password123',
      name: overrides.name ?? 'Test User',
      orgName: overrides.orgName ?? 'Test Org',
    })
    .expect(201);
  return { body: res.body, refreshCookie: extractRefreshCookie(res.headers) };
}

/**
 * Logs in via /auth/login and returns body + refresh token cookie.
 */
export async function loginUser(
  app: INestApplication,
  email: string,
  password: string,
): Promise<RegisterResult> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(201);
  return { body: res.body, refreshCookie: extractRefreshCookie(res.headers) };
}

/**
 * Logs in as admin via /admin/login and returns session cookie.
 */
export async function loginAdmin(
  app: INestApplication,
  password?: string,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/admin/login')
    .send({ password: password ?? process.env.ADMIN_PASSWORD ?? 'test-admin-pass' })
    .expect(201);

  const cookies = res.headers['set-cookie'];
  if (Array.isArray(cookies)) return cookies[0];
  return cookies as string;
}

/** Makes an authenticated GET request with Bearer token. */
export function authGet(app: INestApplication, token: string, path: string) {
  return request(app.getHttpServer())
    .get(path)
    .set('Authorization', `Bearer ${token}`);
}

/** Makes an authenticated POST request with Bearer token. */
export function authPost(app: INestApplication, token: string, path: string, body?: any) {
  return request(app.getHttpServer())
    .post(path)
    .set('Authorization', `Bearer ${token}`)
    .send(body);
}

/** Makes an authenticated PUT request with Bearer token. */
export function authPut(app: INestApplication, token: string, path: string, body?: any) {
  return request(app.getHttpServer())
    .put(path)
    .set('Authorization', `Bearer ${token}`)
    .send(body);
}

/** Makes an authenticated DELETE request with Bearer token. */
export function authDelete(app: INestApplication, token: string, path: string) {
  return request(app.getHttpServer())
    .delete(path)
    .set('Authorization', `Bearer ${token}`);
}

/** Makes an authenticated GET request to the admin API. */
export function adminGet(app: INestApplication, cookie: string, path: string) {
  return request(app.getHttpServer())
    .get(path)
    .set('Cookie', cookie);
}

/** Makes an authenticated POST request to the admin API. */
export function adminPost(app: INestApplication, cookie: string, path: string, body?: any) {
  return request(app.getHttpServer())
    .post(path)
    .set('Cookie', cookie)
    .send(body);
}

/**
 * Logs in as a customer via send-code + verify-code and returns session cookie.
 * Reads the code directly from DB.
 */
export async function loginCustomer(
  app: INestApplication,
  prisma: any,
  email: string,
  projectId = 1,
): Promise<string> {
  // Send code
  await request(app.getHttpServer())
    .post('/api/auth/send-code')
    .send({ email })
    .expect(201);

  // Read code from DB
  const customer = await prisma.customer.findUnique({
    where: { projectId_email: { projectId, email } },
  });

  // Verify code
  const res = await request(app.getHttpServer())
    .post('/api/auth/verify-code')
    .send({ email, code: customer.verificationCode })
    .expect(201);

  const cookies = res.headers['set-cookie'];
  if (Array.isArray(cookies)) return cookies[0];
  return cookies as string;
}
