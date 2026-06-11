/**
 * Notification App — Backend Server
 * Campus Notification Platform | Full Stack Track
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { Log, setAuthToken, requestLogger } = require('../logging_middleware/logger');
const { getToken } = require('../logging_middleware/auth');

const app = express();
const PORT = 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(requestLogger); // HTTP request lifecycle logger

// ── In-memory store ───────────────────────────────────────────────────────────
let notifications = [
  {
    id: uuidv4(), type: 'Placement', message: 'Google hiring — SWE Intern',
    status: 'sent', read: false, createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(), type: 'Result', message: 'Mid-Sem results published',
    status: 'sent', read: false, createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: uuidv4(), type: 'Event', message: 'TechFest 2026 registration open',
    status: 'sent', read: false, createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

// ── Routes ────────────────────────────────────────────────────────────────────

// GET all notifications
app.get('/api/notifications', async (req, res) => {
  await Log('backend', 'info', 'handler', `GET /api/notifications — query: ${JSON.stringify(req.query)}`);
  try {
    let result = [...notifications];

    // Filter by type
    if (req.query.notification_type) {
      result = result.filter(n => n.type === req.query.notification_type);
      await Log('backend', 'debug', 'service', `Filtered by type: ${req.query.notification_type} — ${result.length} results`);
    }

    // Pagination
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const total = result.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = result.slice((page - 1) * limit, page * limit);

    await Log('backend', 'info', 'handler', `Returning ${paginated.length}/${total} notifications (page ${page}/${totalPages})`);

    res.json({
      success: true,
      data: {
        notifications: paginated,
        pagination: { page, limit, total, totalPages },
      },
    });
  } catch (err) {
    await Log('backend', 'error', 'handler', `GET /api/notifications failed: ${err.message}`);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET single notification
app.get('/api/notifications/count/unread', async (req, res) => {
  await Log('backend', 'info', 'handler', 'GET /api/notifications/count/unread');
  const unreadCount = notifications.filter(n => !n.read).length;
  await Log('backend', 'debug', 'service', `Unread count: ${unreadCount}`);
  res.json({ success: true, data: { unreadCount } });
});

// GET priority notifications
app.get('/api/notifications/priority', async (req, res) => {
  const n = parseInt(req.query.n) || 10;
  await Log('backend', 'info', 'handler', `GET /api/notifications/priority — top ${n}`);
  try {
    const TYPE_WEIGHT = { Placement: 3, Result: 2, Event: 1 };
    const scored = notifications.map(notif => {
      const weight = TYPE_WEIGHT[notif.type] || 1;
      const hoursElapsed = (Date.now() - new Date(notif.createdAt).getTime()) / 3600000;
      const score = weight * (1 / (1 + hoursElapsed));
      return { ...notif, priorityScore: parseFloat(score.toFixed(6)) };
    });
    const topN = scored.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, n);
    await Log('backend', 'info', 'service', `Priority inbox computed — top ${topN.length} notifications returned`);
    res.json({ success: true, data: { notifications: topN, count: topN.length } });
  } catch (err) {
    await Log('backend', 'error', 'handler', `Priority fetch failed: ${err.message}`);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET single notification
app.get('/api/notifications/:id', async (req, res) => {
  await Log('backend', 'info', 'handler', `GET /api/notifications/${req.params.id}`);
  const notif = notifications.find(n => n.id === req.params.id);
  if (!notif) {
    await Log('backend', 'warn', 'handler', `Notification ${req.params.id} not found`);
    return res.status(404).json({ success: false, error: 'Notification not found' });
  }
  res.json({ success: true, data: notif });
});

// POST create notification
app.post('/api/notifications', async (req, res) => {
  await Log('backend', 'info', 'handler', `POST /api/notifications — body: ${JSON.stringify(req.body)}`);
  try {
    const { type, message } = req.body;
    const validTypes = ['Placement', 'Result', 'Event'];
    if (!message) {
      await Log('backend', 'warn', 'handler', 'POST /api/notifications — missing required field: message');
      return res.status(400).json({ success: false, error: 'message is required' });
    }
    if (type && !validTypes.includes(type)) {
      await Log('backend', 'warn', 'handler', `Invalid notification type: ${type}`);
      return res.status(400).json({ success: false, error: `type must be one of: ${validTypes.join(', ')}` });
    }
    const notif = {
      id: uuidv4(), type: type || 'Event', message,
      status: 'sent', read: false, createdAt: new Date().toISOString(),
    };
    notifications.unshift(notif);
    await Log('backend', 'info', 'service', `Notification created — id: ${notif.id}, type: ${notif.type}`);
    res.status(201).json({ success: true, data: notif });
  } catch (err) {
    await Log('backend', 'error', 'handler', `POST /api/notifications failed: ${err.message}`);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH mark as read
app.patch('/api/notifications/:id/read', async (req, res) => {
  await Log('backend', 'info', 'handler', `PATCH /api/notifications/${req.params.id}/read`);
  const notif = notifications.find(n => n.id === req.params.id);
  if (!notif) {
    await Log('backend', 'warn', 'handler', `Mark read failed — notification ${req.params.id} not found`);
    return res.status(404).json({ success: false, error: 'Notification not found' });
  }
  notif.read = true;
  notif.readAt = new Date().toISOString();
  await Log('backend', 'info', 'service', `Notification ${req.params.id} marked as read`);
  res.json({ success: true, data: notif });
});

// PATCH mark all as read
app.patch('/api/notifications/read/all', async (req, res) => {
  await Log('backend', 'info', 'handler', 'PATCH /api/notifications/read/all');
  let count = 0;
  notifications.forEach(n => { if (!n.read) { n.read = true; n.readAt = new Date().toISOString(); count++; } });
  await Log('backend', 'info', 'service', `Marked ${count} notifications as read`);
  res.json({ success: true, message: 'All notifications marked as read', updatedCount: count });
});

// DELETE notification
app.delete('/api/notifications/:id', async (req, res) => {
  await Log('backend', 'info', 'handler', `DELETE /api/notifications/${req.params.id}`);
  const idx = notifications.findIndex(n => n.id === req.params.id);
  if (idx === -1) {
    await Log('backend', 'warn', 'handler', `Delete failed — notification ${req.params.id} not found`);
    return res.status(404).json({ success: false, error: 'Notification not found' });
  }
  const deleted = notifications.splice(idx, 1)[0];
  await Log('backend', 'info', 'service', `Notification ${deleted.id} deleted`);
  res.json({ success: true, data: deleted, message: 'Deleted successfully' });
});

// Health check
app.get('/health', async (req, res) => {
  await Log('backend', 'debug', 'handler', 'Health check ping');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    await Log('backend', 'info', 'config', 'Server bootstrap starting...');

    // Try to get auth token for Log API
    try {
      const token = await getToken();
      setAuthToken(token);
      await Log('backend', 'info', 'auth', 'Auth token obtained — Log API authenticated');
    } catch (authErr) {
      await Log('backend', 'warn', 'auth', `Could not get auth token: ${authErr.message} — logs will be sent without auth`);
    }

    app.listen(PORT, async () => {
      await Log('backend', 'info', 'config', `Server started on http://localhost:${PORT}`);
      console.log(`\n✅ Server running on http://localhost:${PORT}`);
      console.log(`📋 API: GET/POST/PATCH/DELETE http://localhost:${PORT}/api/notifications\n`);
    });
  } catch (err) {
    await Log('backend', 'fatal', 'config', `Bootstrap failed: ${err.message}`);
    process.exit(1);
  }
}

bootstrap();
