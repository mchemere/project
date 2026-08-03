const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const frontendPath = path.join(__dirname, '..', 'frontend');
const usersFilePath = path.join(__dirname, 'data', 'users.json');

function ensureUsersStore() {
  const directory = path.dirname(usersFilePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, JSON.stringify([], null, 2));
  }
}

function readUsers() {
  ensureUsersStore();

  try {
    const raw = fs.readFileSync(usersFilePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveUsers(users) {
  ensureUsersStore();
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

app.use(cors());
app.use(express.json());
app.use(express.static(frontendPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const properties = [
  {
    id: 1,
    title: 'Modern 2 Bedroom Apartment',
    location: 'Kisumu, Kenya',
    price: 25000,
    bedrooms: 2,
    bathrooms: 1,
    type: 'Apartment',
    county: 'Kisumu',
    town: 'Kisumu Town',
    neighborhood: 'Mamboleo',
  },
  {
    id: 2,
    title: 'Cozy Family House',
    location: 'Nairobi, Kenya',
    price: 42000,
    bedrooms: 3,
    bathrooms: 2,
    type: 'House',
    county: 'Nairobi',
    town: 'Westlands',
    neighborhood: 'Kileleshwa',
  },
  {
    id: 3,
    title: 'Beachside Studio',
    location: 'Mombasa, Kenya',
    price: 18000,
    bedrooms: 1,
    bathrooms: 1,
    type: 'Studio',
    county: 'Mombasa',
    town: 'Mombasa',
    neighborhood: 'Nyali',
  },
  {
    id: 4,
    title: 'Affordable 1 Bedroom Unit',
    location: 'Nakuru, Kenya',
    price: 15500,
    bedrooms: 1,
    bathrooms: 1,
    type: 'Apartment',
    county: 'Nakuru',
    town: 'Nakuru Town',
    neighborhood: 'Milimani',
  },
  {
    id: 5,
    title: 'Luxury 3 Bedroom Home',
    location: 'Eldoret, Kenya',
    price: 36000,
    bedrooms: 3,
    bathrooms: 2,
    type: 'House',
    county: 'Uasin Gishu',
    town: 'Eldoret',
    neighborhood: 'Kapsoya',
  },
  {
    id: 6,
    title: 'City Center Loft',
    location: 'Nairobi, Kenya',
    price: 30000,
    bedrooms: 2,
    bathrooms: 2,
    type: 'Apartment',
    county: 'Nairobi',
    town: 'Nairobi',
    neighborhood: 'CBD',
  },
];

let users = readUsers();

function createToken() {
  return `demo-token-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'RentKe backend is running' });
});

app.get('/api/properties', (req, res) => {
  res.json({ properties });
});

app.get('/api/properties/:id', (req, res) => {
  const property = properties.find((item) => item.id === Number(req.params.id));

  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }

  return res.json({ property });
});

app.post('/api/register', (req, res) => {
  const { name, email, phone, password, role } = req.body || {};

  if (!name || !email || !phone || !password || !role) {
    return res.status(400).json({ message: 'Please complete all fields.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }

  users = readUsers();
  const emailExists = users.some((user) => user.email.toLowerCase() === email.toLowerCase());
  if (emailExists) {
    return res.status(409).json({ message: 'An account with that email already exists.' });
  }

  const user = {
    id: users.length + 1,
    name,
    email,
    phone,
    role,
    password,
  };

  users.push(user);
  saveUsers(users);

  return res.status(201).json({
    message: 'Account created successfully.',
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  users = readUsers();
  const user = users.find((entry) => entry.email.toLowerCase() === email.toLowerCase() && entry.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  return res.json({
    token: createToken(),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`RentKe API listening on http://localhost:${PORT}`);
  });
}

module.exports = { app, users, properties };
