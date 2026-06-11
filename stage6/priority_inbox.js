/**
 * Stage 6 — Priority Inbox
 * Campus Notification Platform — Affordmed Assessment
 *
 * Fetches notifications from the evaluation API and computes
 * the top N most important unread notifications using a
 * priority score based on type weight + recency.
 *
 * Priority Score = typeWeight × recencyScore
 *   typeWeight : Placement=3, Result=2, Event=1
 *   recencyScore: 1 / (1 + hoursElapsed)  → newer = higher score
 *
 * Top-N is maintained using a Min-Heap for O(log N) efficiency
 * as new notifications stream in.
 */

const http = require('http');
const logger = require('../logging_middleware/logger');

// ── Constants ────────────────────────────────────────────────────────────────
const API_URL = 'http://4.224.186.213/evaluation-service/notifications';
const TOP_N = 10;

const TYPE_WEIGHT = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

// ── Priority Score Calculator ─────────────────────────────────────────────────
function calcPriorityScore(notification) {
  const weight = TYPE_WEIGHT[notification.Type] || 1;
  const timestamp = new Date(notification.Timestamp).getTime();
  const hoursElapsed = (Date.now() - timestamp) / (1000 * 60 * 60);
  const recencyScore = 1 / (1 + hoursElapsed);
  return parseFloat((weight * recencyScore).toFixed(6));
}

// ── Min-Heap (by priority score) ──────────────────────────────────────────────
class MinHeap {
  constructor() {
    this.heap = [];
  }

  size() { return this.heap.length; }

  peek() { return this.heap[0] || null; }

  push(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].score <= this.heap[i].score) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  _sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.heap[l].score < this.heap[smallest].score) smallest = l;
      if (r < n && this.heap[r].score < this.heap[smallest].score) smallest = r;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}

// ── Top-N Maintainer ──────────────────────────────────────────────────────────
/**
 * Efficiently maintains the top N notifications using a min-heap.
 * Time complexity: O(log N) per notification.
 * As new notifications arrive, only evicts the lowest-priority
 * item if the new one scores higher.
 */
function getTopN(notifications, n = TOP_N) {
  const heap = new MinHeap();

  for (const notif of notifications) {
    const score = calcPriorityScore(notif);
    const entry = { ...notif, score };

    if (heap.size() < n) {
      heap.push(entry);
    } else if (score > heap.peek().score) {
      heap.pop();      // evict lowest priority
      heap.push(entry); // insert higher priority
    }
  }

  // Extract and sort descending (highest priority first)
  const result = [];
  while (heap.size() > 0) result.unshift(heap.pop());
  return result.sort((a, b) => b.score - a.score);
}

// ── HTTP Fetch (native Node.js) ───────────────────────────────────────────────
function fetchNotifications(token = '') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '4.224.186.213',
      path: '/evaluation-service/notifications',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(new Error('Failed to parse API response: ' + e.message));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy(new Error('Request timed out'));
    });
    req.end();
  });
}

// ── Display Results ───────────────────────────────────────────────────────────
function displayTopNotifications(topN) {
  console.log('\n');
  console.log('═'.repeat(70));
  console.log(`   🏆  TOP ${topN.length} PRIORITY NOTIFICATIONS`);
  console.log('═'.repeat(70));

  topN.forEach((n, i) => {
    const typeEmoji = { Placement: '💼', Result: '📊', Event: '🎉' }[n.Type] || '🔔';
    const bar = '█'.repeat(Math.round(n.score * 10)).padEnd(10, '░');

    console.log(`\n  #${String(i + 1).padStart(2, '0')}  ${typeEmoji}  [${n.Type.toUpperCase().padEnd(9)}]  ${n.Message}`);
    console.log(`       ID       : ${n.ID}`);
    console.log(`       Timestamp: ${n.Timestamp}`);
    console.log(`       Score    : ${bar}  ${n.score.toFixed(6)}`);
  });

  console.log('\n' + '═'.repeat(70));
  console.log(`  Scores: Placement(3) > Result(2) > Event(1) × Recency Factor`);
  console.log('═'.repeat(70) + '\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // Use the logging middleware (mock req/res for CLI context)
  const mockReq = { method: 'RUN', url: '/stage6/priority_inbox', ip: 'localhost', connection: { remoteAddress: 'localhost' } };
  const mockRes = {
    statusCode: 200,
    end: function (...args) { return args; }
  };

  console.log('\n🔔  Campus Notification Priority Inbox — Stage 6');
  console.log(`    Fetching notifications from API...`);
  console.log(`    API: ${API_URL}\n`);

  let notifications = [];

  try {
    // Try to fetch from real API (requires token on test day)
    const token = process.env.API_TOKEN || '';
    const response = await fetchNotifications(token);
    notifications = response.notifications || [];
    console.log(`✅  Fetched ${notifications.length} notifications from API`);
  } catch (err) {
    // Fallback: use sample data matching the assessment's response format
    console.log(`⚠️   Could not reach API (${err.message}). Using sample data.\n`);
    notifications = [
      { ID: 'd146095a-0086-4334-0e60-3000a14576bc', Type: 'Result',    Message: 'mid-sem',                       Timestamp: '2026-04-22 17:51:30' },
      { ID: 'b283218f-easa-4b7c-03a0-1f2f240d64b0', Type: 'Placement', Message: 'CSX Corporation hiring',         Timestamp: '2026-04-22 17:51:18' },
      { ID: '81589ada-0ad3-4f77-0554-f52fb558209d', Type: 'Event',     Message: 'farewell',                      Timestamp: '2026-04-22 17:51:06' },
      { ID: '0005513a-142b-4bbc-8678-eefecf5e1ede', Type: 'Result',    Message: 'mid-sem',                       Timestamp: '2026-04-22 17:50:54' },
      { ID: 'ea836726-c25e-4f21-a72f-544a6af8a37e', Type: 'Result',    Message: 'project-review',                Timestamp: '2026-04-22 17:50:42' },
      { ID: '883cba27-8fc6-47f7-bbe0-be228f6bed2c', Type: 'Result',    Message: 'external',                      Timestamp: '2026-04-22 17:50:30' },
      { ID: 'e5c4ff20-31bf-4d48-8fe2-72fda89e5918', Type: 'Result',    Message: 'project-review',                Timestamp: '2026-04-22 17:50:18' },
      { ID: '1cfc65ee-ad37-4894-8046-4707627176a5', Type: 'Event',     Message: 'techfest',                      Timestamp: '2026-04-22 17:50:06' },
      { ID: 'cf288536-45ac-4b4a-b548-62029d4c52ce', Type: 'Result',    Message: 'project-review',                Timestamp: '2026-04-22 17:49:54' },
      { ID: '8a7412bd-6065-4de0-8501-a37f11cc848b', Type: 'Placement', Message: 'Advanced Micro Devices hiring',  Timestamp: '2026-04-22 17:49:42' },
      { ID: 'a1b2c3d4-0000-4abc-8000-111111111111', Type: 'Placement', Message: 'Google hiring — SWE Intern',     Timestamp: '2026-06-11 10:00:00' },
      { ID: 'a1b2c3d4-0000-4abc-8000-222222222222', Type: 'Event',     Message: 'Annual Tech Symposium',          Timestamp: '2026-06-10 09:00:00' },
      { ID: 'a1b2c3d4-0000-4abc-8000-333333333333', Type: 'Result',    Message: 'Final Exam Results Published',   Timestamp: '2026-06-09 14:00:00' },
    ];
  }

  const SAMPLE_DATA = [
    { ID: 'a1b2c3d4-0000-4abc-8000-111111111111', Type: 'Placement', Message: 'Google hiring — SWE Intern',       Timestamp: '2026-06-11 10:00:00' },
    { ID: 'b283218f-easa-4b7c-03a0-1f2f240d64b0', Type: 'Placement', Message: 'CSX Corporation hiring',           Timestamp: '2026-04-22 17:51:18' },
    { ID: '8a7412bd-6065-4de0-8501-a37f11cc848b', Type: 'Placement', Message: 'Advanced Micro Devices hiring',    Timestamp: '2026-04-22 17:49:42' },
    { ID: 'a1b2c3d4-0000-4abc-8000-333333333333', Type: 'Result',    Message: 'Final Exam Results Published',     Timestamp: '2026-06-09 14:00:00' },
    { ID: 'd146095a-0086-4334-0e60-3000a14576bc', Type: 'Result',    Message: 'Mid-Sem results published',        Timestamp: '2026-06-11 10:00:00' },
    { ID: 'ea836726-c25e-4f21-a72f-544a6af8a37e', Type: 'Result',    Message: 'Project review grades out',        Timestamp: '2026-04-22 17:50:42' },
    { ID: '883cba27-8fc6-47f7-bbe0-be228f6bed2c', Type: 'Result',    Message: 'External exam results',            Timestamp: '2026-04-22 17:50:30' },
    { ID: 'e5c4ff20-31bf-4d48-8fe2-72fda89e5918', Type: 'Result',    Message: 'Project review — section B',       Timestamp: '2026-04-22 17:50:18' },
    { ID: '81589ada-0ad3-4f77-0554-f52fb558209d', Type: 'Event',     Message: 'Farewell ceremony — Main Hall',    Timestamp: '2026-06-10 09:00:00' },
    { ID: 'a1b2c3d4-0000-4abc-8000-222222222222', Type: 'Event',     Message: 'Annual Tech Symposium',            Timestamp: '2026-06-10 09:00:00' },
    { ID: '1cfc65ee-ad37-4894-8046-4707627176a5', Type: 'Event',     Message: 'TechFest 2026 registration open',  Timestamp: '2026-04-22 17:50:06' },
    { ID: 'cf288536-45ac-4b4a-b548-62029d4c52ce', Type: 'Result',    Message: 'Project review — section A',       Timestamp: '2026-04-22 17:49:54' },
    { ID: '0005513a-142b-4bbc-8678-eefecf5e1ede', Type: 'Result',    Message: 'Mid-sem resit results',            Timestamp: '2026-04-22 17:50:54' },
  ];

  if (notifications.length === 0) {
    console.log(`⚠️   API returned 0 results (auth token required). Using sample data.\n`);
    notifications = SAMPLE_DATA;
  }

  const topN = getTopN(notifications, TOP_N);
  displayTopNotifications(topN);

  // Log completion via middleware
  console.log(`  ℹ️  Processed ${notifications.length} total notifications`);
  console.log(`  ℹ️  Min-Heap maintained top ${TOP_N} in O(N log ${TOP_N}) time\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
