const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// =============================
// In-memory "database"
// =============================
let items = [
  { id: 1, name: 'Item One', description: 'First item' },
  { id: 2, name: 'Item Two', description: 'Second item' },
];
let nextId = 3;

// =============================
// REST API CRUD Routes
// =============================

// GET all items
app.get('/api/items', (req, res) => {
  res.json({ success: true, data: items });
});

// GET single item by ID
app.get('/api/items/:id', (req, res) => {
  const item = items.find(i => i.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
  res.json({ success: true, data: item });
});

// POST create new item
app.post('/api/items', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

  const newItem = { id: nextId++, name, description: description || '' };
  items.push(newItem);
  res.status(201).json({ success: true, data: newItem });
});

// PUT update item
app.put('/api/items/:id', (req, res) => {
  const index = items.findIndex(i => i.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ success: false, message: 'Item not found' });

  const { name, description } = req.body;
  items[index] = { ...items[index], name: name || items[index].name, description: description || items[index].description };
  res.json({ success: true, data: items[index] });
});

// DELETE item
app.delete('/api/items/:id', (req, res) => {
  const index = items.findIndex(i => i.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ success: false, message: 'Item not found' });

  const deleted = items.splice(index, 1);
  res.json({ success: true, data: deleted[0], message: 'Deleted successfully' });
});

// =============================
// OOP Example - Class-based
// =============================
class Stack {
  constructor() {
    this.data = [];
  }
  push(val) { this.data.push(val); }
  pop() { return this.data.pop(); }
  peek() { return this.data[this.data.length - 1]; }
  isEmpty() { return this.data.length === 0; }
  size() { return this.data.length; }
}

// DSA Example Route - uses Stack class
app.get('/api/dsa/stack-demo', (req, res) => {
  const s = new Stack();
  s.push(10); s.push(20); s.push(30);
  const result = [];
  while (!s.isEmpty()) result.push(s.pop());
  res.json({ success: true, popped_in_order: result });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📌 Test: GET http://localhost:${PORT}/api/items`);
});
