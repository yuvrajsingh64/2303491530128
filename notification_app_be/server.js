const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const logger = require('../logging_middleware/logger');

const app = express();
const PORT = 3001;

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(logger); // Custom logging middleware

// ── In-memory store ─────────────────────────────────────────
let notifications = [
  {
    id: uuidv4(),
    type: 'in-app',
    recipient: 'yuvraj@example.com',
    title: 'Welcome!',
    message: 'Welcome to the Notification System.',
    status: 'sent',
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    type: 'email',
    recipient: 'yuvraj@example.com',
    title: 'Assessment Reminder',
    message: 'Your coding assessment starts today at 10:00 AM.',
    status: 'sent',
    read: false,
    createdAt: new Date().toISOString(),
  },
];

// ── Routes ───────────────────────────────────────────────────

// GET all notifications
app.get('/api/notifications', (req, res) => {
  res.json({ success: true, count: notifications.length, data: notifications });
});

// GET single notification
app.get('/api/notifications/:id', (req, res) => {
  const notification = notifications.find(n => n.id === req.params.id);
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
  res.json({ success: true, data: notification });
});

// POST create notification
app.post('/api/notifications', (req, res) => {
  const { type, recipient, title, message } = req.body;

  if (!recipient || !title || !message) {
    return res.status(400).json({ success: false, message: 'recipient, title, and message are required' });
  }

  const validTypes = ['email', 'sms', 'push', 'in-app'];
  const notifType = validTypes.includes(type) ? type : 'in-app';

  const newNotification = {
    id: uuidv4(),
    type: notifType,
    recipient,
    title,
    message,
    status: 'sent',
    read: false,
    createdAt: new Date().toISOString(),
  };

  notifications.unshift(newNotification);
  res.status(201).json({ success: true, data: newNotification });
});

// PATCH mark as read
app.patch('/api/notifications/:id/read', (req, res) => {
  const notification = notifications.find(n => n.id === req.params.id);
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });

  notification.read = true;
  res.json({ success: true, data: notification });
});

// PATCH mark ALL as read
app.patch('/api/notifications/read/all', (req, res) => {
  notifications.forEach(n => (n.read = true));
  res.json({ success: true, message: 'All notifications marked as read' });
});

// DELETE notification
app.delete('/api/notifications/:id', (req, res) => {
  const index = notifications.findIndex(n => n.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Notification not found' });

  const deleted = notifications.splice(index, 1);
  res.json({ success: true, data: deleted[0], message: 'Deleted successfully' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ── Start server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ Notification API running at http://localhost:${PORT}`);
  console.log(`📋 Endpoints:`);
  console.log(`   GET    http://localhost:${PORT}/api/notifications`);
  console.log(`   POST   http://localhost:${PORT}/api/notifications`);
  console.log(`   PATCH  http://localhost:${PORT}/api/notifications/:id/read`);
  console.log(`   PATCH  http://localhost:${PORT}/api/notifications/read/all`);
  console.log(`   DELETE http://localhost:${PORT}/api/notifications/:id\n`);
});
