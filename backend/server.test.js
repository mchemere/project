const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('./server');

const request = async (baseUrl, path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, options);
  return response;
};

const usersFilePath = path.join(__dirname, 'data', 'users.json');

function resetUserStore() {
  fs.mkdirSync(path.dirname(usersFilePath), { recursive: true });
  fs.writeFileSync(usersFilePath, JSON.stringify([], null, 2));
}

test('GET /api/health returns status ok', async () => {
  resetUserStore();
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const response = await request(`http://localhost:${port}`, '/api/health');
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.status, 'ok');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('POST /api/register creates user and persists it to disk', async () => {
  resetUserStore();
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const registerResponse = await request(`http://localhost:${port}`, '/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'persisted@example.com',
        phone: '+254700000000',
        password: 'password123',
        role: 'tenant',
      }),
    });

    const registerBody = await registerResponse.json();
    assert.equal(registerResponse.status, 201);
    assert.equal(registerBody.user.email, 'persisted@example.com');

    const savedUsers = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
    assert.equal(savedUsers.length, 1);
    assert.equal(savedUsers[0].email, 'persisted@example.com');

    const loginResponse = await request(`http://localhost:${port}`, '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'persisted@example.com', password: 'password123' }),
    });

    const loginBody = await loginResponse.json();
    assert.equal(loginResponse.status, 200);
    assert.ok(loginBody.token);
    assert.equal(loginBody.user.role, 'tenant');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
