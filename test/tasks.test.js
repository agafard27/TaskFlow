const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const createApp = require('../src/app');

async function startApp(dataFile) {
  const server = createApp({ dataFile }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => {
      if (!server.listening) return Promise.resolve();
      return new Promise((resolve, reject) => {
        server.close(err => err ? reject(err) : resolve());
        server.closeAllConnections();
      });
    },
  };
}

async function fixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'taskflow-test-'));
  const dataFile = path.join(directory, 'tasks.json');
  const app = await startApp(dataFile);
  t.after(async () => {
    await app.close();
    await fs.rm(directory, { recursive: true, force: true });
  });
  return { ...app, dataFile };
}

function send(url, method, body) {
  return fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('CRUD: ekleme, listeleme, detay, güncelleme ve silme', async t => {
  const app = await fixture(t);
  const created = await send(`${app.url}/tasks`, 'POST', {
    title: '  API geliştir  ', description: 'CRUD işlemlerini tamamla',
    assignee: 'Ayşe', priority: 'high',
  });
  assert.equal(created.status, 201);
  const task = await created.json();
  assert.equal(task.title, 'API geliştir');
  assert.equal(task.status, 'pending');
  assert.equal(task.priority, 'high');
  assert.equal(task.assignee, 'Ayşe');
  assert.equal(task.id, 1);
  assert.ok(Number.isFinite(Date.parse(task.createdAt)));
  assert.equal(created.headers.get('location'), `/tasks/${task.id}`);

  const list = await fetch(`${app.url}/tasks`);
  assert.equal(list.status, 200);
  assert.deepEqual(await list.json(), [task]);
  const detail = await fetch(`${app.url}/tasks/${task.id}`);
  assert.equal(detail.status, 200);
  assert.deepEqual(await detail.json(), task);

  const update = await send(`${app.url}/tasks/${task.id}`, 'PUT', { status: 'completed' });
  assert.equal(update.status, 200);
  const updated = await update.json();
  assert.equal(updated.status, 'completed');
  assert.equal(updated.id, task.id);
  assert.equal(updated.createdAt, task.createdAt);
  assert.equal(updated.title, task.title);
  assert.equal((await (await fetch(`${app.url}/tasks/${task.id}`)).json()).status, 'completed');

  const removed = await fetch(`${app.url}/tasks/${task.id}`, { method: 'DELETE' });
  assert.equal(removed.status, 204);
  assert.equal(await removed.text(), '');
  assert.equal((await fetch(`${app.url}/tasks/${task.id}`)).status, 404);
  assert.deepEqual(await (await fetch(`${app.url}/tasks`)).json(), []);
});

test('görevler yeni uygulama açıldığında dosyadan geri okunur', async t => {
  const app = await fixture(t);
  const created = await send(`${app.url}/tasks`, 'POST', { title: 'Kalıcı görev' });
  const task = await created.json();
  await app.close();
  const restarted = await startApp(app.dataFile);
  try {
    assert.deepEqual(await (await fetch(`${restarted.url}/tasks/${task.id}`)).json(), task);
    await send(`${restarted.url}/tasks/${task.id}`, 'PUT', { assignee: 'Mehmet' });
    assert.equal(JSON.parse(await fs.readFile(app.dataFile, 'utf8'))[0].assignee, 'Mehmet');
  } finally {
    await restarted.close();
  }
});

test('geçersiz veriler 400 döndürür ve kayıtları değiştirmez', async t => {
  const app = await fixture(t);
  const invalidBodies = [
    {}, { title: '' }, { title: '   ' }, { title: 42 },
    { title: 'Görev', priority: 'urgent' },
    { title: 'Görev', status: 'done' },
    { title: 'Görev', assignee: 12 },
    { title: 'Görev', description: null },
    { title: 'Görev', id: 'elle-verilen-id' }, [], null,
  ];
  for (const body of invalidBodies) {
    const result = await send(`${app.url}/tasks`, 'POST', body);
    assert.equal(result.status, 400, JSON.stringify(body));
    assert.equal(typeof (await result.json()).message, 'string');
  }
  const task = await (await send(`${app.url}/tasks`, 'POST', { title: 'Korunan görev' })).json();
  for (const body of [{}, { title: '' }, { createdAt: 'yeni' }, { status: 'done' }]) {
    assert.equal((await send(`${app.url}/tasks/${task.id}`, 'PUT', body)).status, 400);
  }
  assert.deepEqual(await (await fetch(`${app.url}/tasks/${task.id}`)).json(), task);
});

test('olmayan görevler ve endpoint için JSON 404 yanıtı', async t => {
  const app = await fixture(t);
  for (const method of ['GET', 'PUT', 'DELETE']) {
    const response = await fetch(`${app.url}/tasks/olmayan-id`, {
      method, ...(method === 'PUT' ? {
        headers: { 'Content-Type': 'application/json' }, body: '{"title":"Görev"}',
      } : {}),
    });
    assert.equal(response.status, 404);
    assert.equal((await response.json()).message, 'Görev bulunamadı.');
  }
  const unknown = await fetch(`${app.url}/olmayan-endpoint`);
  assert.equal(unknown.status, 404);
  assert.equal((await unknown.json()).message, 'Endpoint bulunamadı.');
});

test('bozuk JSON ve büyük istekler açıklayıcı hata döndürür', async t => {
  const app = await fixture(t);
  const malformed = await fetch(`${app.url}/tasks`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bozuk',
  });
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).message, 'Geçerli bir JSON gövdesi gönderin.');
  const oversized = await send(`${app.url}/tasks`, 'POST', { title: 'x'.repeat(110000) });
  assert.equal(oversized.status, 413);
  assert.equal(typeof (await oversized.json()).message, 'string');
});

test('logger başarılı ve hatalı isteklerin metodunu, adresini, zamanını kaydeder', async t => {
  const app = await fixture(t);
  const log = t.mock.method(console, 'log', () => {});
  await fetch(`${app.url}/tasks`);
  await fetch(`${app.url}/tasks`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bozuk',
  });
  const messages = log.mock.calls.map(call => call.arguments[0]);
  assert.ok(messages.some(message => /^\[\d{4}-\d{2}-\d{2}T[^\]]+\] GET \/tasks$/.test(message)));
  assert.ok(messages.some(message => /POST \/tasks$/.test(message)));
});

test('eşzamanlı ekleme isteklerinde kayıt kaybolmaz ve id değerleri benzersizdir', async t => {
  const app = await fixture(t);
  const responses = await Promise.all(Array.from({ length: 10 }, (_, i) =>
    send(`${app.url}/tasks`, 'POST', { title: `Görev ${i}` })));
  assert.ok(responses.every(response => response.status === 201));
  const tasks = await (await fetch(`${app.url}/tasks`)).json();
  assert.equal(tasks.length, 10);
  assert.equal(new Set(tasks.map(task => task.id)).size, 10);
  assert.deepEqual(tasks.map(task => task.id).sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test('silinen kimlikler sunucu yeniden açıldığında tekrar kullanılmaz', async t => {
  const app = await fixture(t);
  const first = await (await send(`${app.url}/tasks`, 'POST', { title: 'İlk görev' })).json();
  const second = await (await send(`${app.url}/tasks`, 'POST', { title: 'İkinci görev' })).json();
  assert.equal(first.id, 1);
  assert.equal(second.id, 2);
  assert.equal((await fetch(`${app.url}/tasks/2`, { method: 'DELETE' })).status, 204);
  assert.equal((await fetch(`${app.url}/tasks/1`, { method: 'DELETE' })).status, 204);
  await app.close();
  const restarted = await startApp(app.dataFile);
  try {
    const response = await send(`${restarted.url}/tasks`, 'POST', { title: 'Yeni görev' });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).id, 3);
  } finally {
    await restarted.close();
  }
});
