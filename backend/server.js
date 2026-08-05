const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveUsers(users) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

app.post('/api/register', async (req, res) => {
  const { name, email, phone, password, role } = req.body || {};

  if (!name || !email || !phone || !password || !role) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({ error: 'Please use a valid email address.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  if (!/^[0-9]{10}$/.test(phone)) {
    return res.status(400).json({ error: 'Phone number must be exactly 10 digits.' });
  }

  const users = loadUsers();
  const existing = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: crypto.randomUUID(),
    name,
    email: email.toLowerCase(),
    phone,
    role,
    passwordHash: hashedPassword,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  saveUsers(users);

  res.status(201).json({ message: 'Account created successfully. Please login.' });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const users = loadUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
  });
});

app.listen(PORT, () => {
  console.log(`RentKe server running at http://localhost:${PORT}`);
});
