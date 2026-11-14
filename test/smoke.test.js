// End-to-end checks against a running server (npm start) with seeded destinations (npm run seed).
const test = require('node:test');
const assert = require('node:assert');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const username = `traveller${Date.now()}`;
let cookie = '';

async function request(path, { method = 'GET', form } = {}) {
  const res = await fetch(BASE + path, {
    method,
    redirect: 'manual',
    headers: {
      ...(cookie && { cookie }),
      ...(form && { 'content-type': 'application/x-www-form-urlencoded' }),
    },
    body: form && new URLSearchParams(form).toString(),
  });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  return { status: res.status, location: res.headers.get('location'), body: await res.text() };
}

test('pages require a login', async () => {
  for (const path of ['/', '/paris', '/wanttogo']) {
    const res = await request(path);
    assert.strictEqual(res.status, 302, path);
    assert.strictEqual(res.location, '/login', path);
  }
});

test('registration validates its input', async () => {
  const empty = await request('/register', { method: 'POST', form: { username: '', password: '' } });
  assert.match(empty.body, /fill in both/);

  const ok = await request('/register', { method: 'POST', form: { username, password: 'pw' } });
  assert.strictEqual(ok.location, '/login?success=1');

  const taken = await request('/register', { method: 'POST', form: { username, password: 'pw' } });
  assert.match(taken.body, /already taken/);
});

test('login', async () => {
  const wrong = await request('/login', { method: 'POST', form: { username, password: 'nope' } });
  assert.match(wrong.body, /Invalid username or password/);

  const ok = await request('/login', { method: 'POST', form: { username, password: 'pw' } });
  assert.strictEqual(ok.location, '/');
  assert.strictEqual((await request('/')).status, 200);
});

test('category and destination pages', async () => {
  for (const path of ['/hiking', '/cities', '/islands', '/paris', '/rome', '/santorini', '/bali', '/inca', '/annapurna']) {
    assert.strictEqual((await request(path)).status, 200, path);
  }
});

test('want-to-go list', async () => {
  const added = await request('/wanttogo', { method: 'POST', form: { destinationName: 'Paris' } });
  assert.strictEqual(added.location, '/wanttogo?status=added');

  const again = await request('/wanttogo', { method: 'POST', form: { destinationName: 'Paris' } });
  assert.strictEqual(again.location, '/wanttogo?status=exists');

  const list = await request('/wanttogo');
  assert.match(list.body, /<strong>Paris<\/strong>/);
});

test('search', async () => {
  const partial = await request('/search', { method: 'POST', form: { Search: 'an' } });
  assert.match(partial.body, /Annapurna/);
  assert.match(partial.body, /Santorini/);
  assert.doesNotMatch(partial.body, /<strong>Paris<\/strong>/);

  const caseInsensitive = await request('/search', { method: 'POST', form: { Search: 'ROME' } });
  assert.match(caseInsensitive.body, /<strong>Rome<\/strong>/);

  const missing = await request('/search', { method: 'POST', form: { Search: 'Atlantis' } });
  assert.match(missing.body, /Destination not Found/);
});

test('logout', async () => {
  await request('/logout');
  assert.strictEqual((await request('/wanttogo')).location, '/login');
});
