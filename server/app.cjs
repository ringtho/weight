const bcrypt       = require('bcryptjs');
const cookieParser = require('cookie-parser');
const cors         = require('cors');
const express      = require('express');
const jwt          = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI   = process.env.MONGO_URI;
const JWT_SECRET  = process.env.JWT_SECRET || 'fat-loss-tracker-dev-secret-change-in-prod';
const JWT_EXPIRES = '30d';
const COOKIE_NAME = 'flt_token';
const SALT_ROUNDS = 12;
const IS_PROD     = process.env.NODE_ENV === 'production' || !!process.env.NETLIFY;

// ── MongoDB ───────────────────────────────────────────────────────────────────

const mongoClient = new MongoClient(MONGO_URI);
let db;

async function connectDB() {
  if (db) return; // reuse connection across warm invocations
  await mongoClient.connect();
  db = mongoClient.db();
  await db.collection('users').createIndex(
    { username: 1 },
    { unique: true, collation: { locale: 'en', strength: 2 } }
  );
  await db.collection('user_state').createIndex({ user_id: 1 }, { unique: true });
  console.log('Connected to MongoDB');
}

// ── App setup ─────────────────────────────────────────────────────────────────

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ── Helpers ───────────────────────────────────────────────────────────────────

function issueToken(res, userId) {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Not authenticated.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    res.clearCookie(COOKIE_NAME);
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

const requireAdmin = wrap(async (req, res, next) => {
  const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  req.adminUser = user;
  next();
});

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function userToJson(u) {
  return { id: u._id.toString(), username: u.username, name: u.name, email: u.email, role: u.role };
}

// ── Auth routes ───────────────────────────────────────────────────────────────

app.post('/api/auth/register', wrap(async (req, res) => {
  const { password, name, email } = req.body ?? {};

  if (!password || typeof password !== 'string' || password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  if (!name || typeof name !== 'string' || name.trim().length < 1)
    return res.status(400).json({ error: 'Full name is required.' });
  if (!isValidEmail(email))
    return res.status(400).json({ error: 'A valid email address is required.' });

  const cleanName     = name.trim();
  const cleanEmail    = email.trim().toLowerCase();
  const cleanUsername = cleanEmail;

  const existing = await db.collection('users').findOne(
    { username: cleanUsername },
    { collation: { locale: 'en', strength: 2 } }
  );
  if (existing) return res.status(409).json({ error: 'An account with that email already exists.' });

  const count = await db.collection('users').countDocuments();
  const role  = count === 0 ? 'admin' : 'user';

  const hash   = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await db.collection('users').insertOne({
    username:      cleanUsername,
    password_hash: hash,
    name:          cleanName,
    email:         cleanEmail,
    role,
    created_at:    Date.now(),
    last_login:    null,
  });

  const userId = result.insertedId.toString();
  issueToken(res, userId);
  res.status(201).json({ id: userId, username: cleanUsername, name: cleanName, email: cleanEmail, role });
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const { email, username, password } = req.body ?? {};
  const identifier = (email || username || '').trim().toLowerCase();
  if (!identifier || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  const user = await db.collection('users').findOne(
    { username: identifier },
    { collation: { locale: 'en', strength: 2 } }
  );
  if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });

  await db.collection('users').updateOne({ _id: user._id }, { $set: { last_login: Date.now() } });

  issueToken(res, user._id.toString());
  res.json(userToJson(user));
}));

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.status(204).end();
});

app.get('/api/auth/me', requireAuth, wrap(async (req, res) => {
  const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
  if (!user) { res.clearCookie(COOKIE_NAME); return res.status(401).json({ error: 'User not found.' }); }
  res.json(userToJson(user));
}));

// ── Admin routes ──────────────────────────────────────────────────────────────

app.get('/api/admin/users', requireAuth, requireAdmin, wrap(async (_req, res) => {
  const users  = await db.collection('users').find({}).sort({ created_at: -1 }).toArray();
  const states = await db.collection('user_state').find({}).toArray();
  const stateMap = new Map(states.map(s => [s.user_id.toString(), s]));

  res.json(users.map(u => {
    const state = stateMap.get(u._id.toString());
    return {
      id: u._id.toString(), username: u.username, name: u.name, email: u.email, role: u.role,
      created_at: u.created_at, last_login: u.last_login || null,
      has_data: state ? 1 : 0, last_saved: state ? state.updated_at : null,
      data_bytes: state ? JSON.stringify(state.data).length : 0,
    };
  }));
}));

app.delete('/api/admin/users/:id', requireAuth, requireAdmin, wrap(async (req, res) => {
  if (req.params.id === req.userId)
    return res.status(400).json({ error: 'You cannot delete your own account.' });
  const targetId = new ObjectId(req.params.id);
  await db.collection('user_state').deleteOne({ user_id: targetId });
  await db.collection('users').deleteOne({ _id: targetId });
  res.status(204).end();
}));

app.patch('/api/admin/users/:id/role', requireAuth, requireAdmin, wrap(async (req, res) => {
  const { role } = req.body ?? {};
  if (role !== 'admin' && role !== 'user')
    return res.status(400).json({ error: 'Role must be "admin" or "user".' });
  if (req.params.id === req.userId && role !== 'admin')
    return res.status(400).json({ error: 'You cannot remove your own admin role.' });
  await db.collection('users').updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { role } }
  );
  res.status(204).end();
}));

app.get('/api/admin/users/:id/stats', requireAuth, requireAdmin, wrap(async (req, res) => {
  const stateDoc = await db.collection('user_state').findOne({ user_id: new ObjectId(req.params.id) });
  if (!stateDoc) return res.json(null);

  const state = stateDoc.data;
  const { goals, weeklyData, dailyData } = state || {};
  const DAYS_PER_WEEK = 7;
  const unit          = goals?.unit || 'metric';
  const startWeight   = parseFloat(goals?.startWeight) || null;
  const targetWeight  = parseFloat(goals?.targetWeight) || null;

  let currentWeight = startWeight;
  let totalWorkouts = 0, weeksActive = 0, calSum = 0, calCount = 0, inchesLost = 0;
  const weekWeights = [];
  const firstMeas   = weeklyData?.[1] || {};
  let latestMeas    = {};

  const maxWeek = Math.max(12, ...Object.keys(weeklyData || {}).map(Number).filter(n => !isNaN(n)), 0);

  for (let w = 1; w <= maxWeek; w++) {
    const week = weeklyData?.[w];
    if (!week) continue;
    if (week.weight || week.workouts || week.notes || week.progressPhotos?.length) weeksActive++;
    if (week.weight) {
      currentWeight = parseFloat(week.weight);
      weekWeights.push({ week: w, weight: currentWeight });
      latestMeas = week;
    }
    totalWorkouts += parseInt(week.workouts) || 0;
    const days = dailyData?.[w];
    if (days) {
      for (let d = 1; d <= DAYS_PER_WEEK; d++) {
        const c = parseFloat(days[d]?.calories);
        if (!isNaN(c) && c > 0) { calSum += c; calCount++; }
      }
    }
  }

  for (const key of ['waist', 'hips', 'chest', 'thigh', 'arm', 'neck']) {
    const s = parseFloat(firstMeas[key]);
    const e = parseFloat(latestMeas[key] || firstMeas[key]);
    if (!isNaN(s) && !isNaN(e) && s > 0) inchesLost += Math.max(0, s - e);
  }

  const weightLost  = startWeight && currentWeight ? +(startWeight - currentWeight).toFixed(1) : null;
  const progressPct = startWeight && targetWeight && startWeight !== targetWeight && weightLost !== null
    ? Math.min(100, Math.max(0, Math.round((weightLost / (startWeight - targetWeight)) * 100))) : 0;
  const photoCount  = Object.values(weeklyData || {}).reduce((s, w) => s + (w.progressPhotos?.length || 0), 0);

  res.json({
    unit, startWeight, targetWeight, currentWeight, weightLost, progressPct,
    totalWorkouts, weeksActive, currentWeek: state.currentWeek || 1,
    avgCalories: calCount > 0 ? Math.round(calSum / calCount) : null,
    inchesLost: +inchesLost.toFixed(1),
    startDate: goals?.startDate || null,
    weekWeights, photoCount,
  });
}));

// ── State routes ──────────────────────────────────────────────────────────────

app.get('/api/state', requireAuth, wrap(async (req, res) => {
  const doc = await db.collection('user_state').findOne({ user_id: new ObjectId(req.userId) });
  if (!doc) return res.status(204).end();
  res.json(doc.data);
}));

app.post('/api/state', requireAuth, wrap(async (req, res) => {
  if (!req.body || typeof req.body !== 'object')
    return res.status(400).json({ error: 'Invalid payload.' });
  await db.collection('user_state').updateOne(
    { user_id: new ObjectId(req.userId) },
    { $set: { data: req.body, updated_at: Date.now() } },
    { upsert: true }
  );
  res.status(204).end();
}));

app.delete('/api/state', requireAuth, wrap(async (req, res) => {
  await db.collection('user_state').deleteOne({ user_id: new ObjectId(req.userId) });
  res.status(204).end();
}));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

module.exports = { app, connectDB };
