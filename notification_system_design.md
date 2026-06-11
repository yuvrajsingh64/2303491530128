# Notification System Design
## Campus Notification Platform — Affordmed Assessment

---

# Stage 1

## REST API Design & Contract

### Base URL
```
http://localhost:3001/api
```

### Authentication
All routes assume pre-authorised users (no login/registration required per evaluation constraints). The `studentId` is passed as a request header.

```
Headers (all requests):
  Content-Type: application/json
  x-student-id: <studentId>       # identifies the pre-authorised user
```

---

### Endpoints

#### 1. Get All Notifications (Paginated)
```
GET /api/notifications
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 20) |
| `notification_type` | string | No | Filter: `Placement`, `Result`, `Event` |

**Request Headers:**
```json
{
  "x-student-id": "1042",
  "Content-Type": "application/json"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "d146095a-0086-4334-0e60-3000a14576bc",
        "type": "Placement",
        "message": "CSX Corporation hiring",
        "isRead": false,
        "createdAt": "2026-04-22T17:51:18Z",
        "studentId": "1042"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid notification_type. Must be one of: Placement, Result, Event"
}
```

---

#### 2. Get Single Notification
```
GET /api/notifications/:id
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "d146095a-0086-4334-0e60-3000a14576bc",
    "type": "Placement",
    "message": "CSX Corporation hiring",
    "isRead": true,
    "createdAt": "2026-04-22T17:51:18Z",
    "studentId": "1042"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Notification not found"
}
```

---

#### 3. Mark Notification as Read
```
PATCH /api/notifications/:id/read
```

**Request Headers:**
```json
{
  "x-student-id": "1042"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "d146095a-0086-4334-0e60-3000a14576bc",
    "isRead": true,
    "readAt": "2026-06-11T12:00:00Z"
  }
}
```

---

#### 4. Mark All Notifications as Read
```
PATCH /api/notifications/read/all
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "updatedCount": 15
}
```

---

#### 5. Get Priority Notifications (Top N)
```
GET /api/notifications/priority?n=10
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `n` | integer | No | Number of top notifications (default: 10) |
| `notification_type` | string | No | Filter by type |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "b283218f-easa-4b7c-03a0-1f2f240d64b0",
        "type": "Placement",
        "message": "CSX Corporation hiring",
        "isRead": false,
        "priorityScore": 95.4,
        "createdAt": "2026-04-22T17:51:18Z"
      }
    ],
    "count": 10
  }
}
```

---

#### 6. Get Unread Notification Count
```
GET /api/notifications/count/unread
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "unreadCount": 23
  }
}
```

---

#### 7. Send Notification to All Students (Admin / HR)
```
POST /api/notifications/broadcast
```

**Request Body:**
```json
{
  "type": "Placement",
  "message": "Infosys is hiring — apply by June 20",
  "studentIds": ["1042", "1043", "1044"]
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Broadcast queued for 50000 students",
  "jobId": "job-uuid-here"
}
```

---

#### 8. Delete Notification
```
DELETE /api/notifications/:id
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

### Real-Time Notification Mechanism

**Chosen Approach: Server-Sent Events (SSE)**

SSE is chosen over WebSockets because:
- Notifications are **one-directional** (server → client only)
- SSE works natively over HTTP — no special protocol upgrade needed
- Simpler to implement and scales better with HTTP/2 multiplexing
- Automatic reconnection built into browser EventSource API

**SSE Endpoint:**
```
GET /api/notifications/stream
Headers: { "x-student-id": "1042" }
```

**Client-Side (React):**
```javascript
const eventSource = new EventSource('/api/notifications/stream', {
  headers: { 'x-student-id': studentId }
});
eventSource.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  // update UI
};
```

**Server-Side (Express):**
```javascript
app.get('/api/notifications/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // push events when new notifications arrive
});
```

---

# Stage 2

## Database Design

### Recommended Database: PostgreSQL

**Reasons for choosing PostgreSQL:**
- Notifications have a **well-defined, consistent schema** — relational fits perfectly
- Strong support for **enum types** (`notification_type`)
- Excellent **indexing** (B-tree, partial indexes) for read-heavy workloads
- Native support for **JSON columns** for extensible metadata
- ACID compliance — critical for reliable notification delivery tracking
- Proven scalability with read replicas and partitioning

---

### DB Schema

```sql
-- Enum for notification type
CREATE TYPE notification_type AS ENUM ('Placement', 'Result', 'Event');

-- Core notifications table
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            notification_type NOT NULL,
  message         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}'
);

-- Tracks per-student read/delivery status
CREATE TABLE student_notifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       INTEGER NOT NULL,
  notification_id  UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  is_read          BOOLEAN NOT NULL DEFAULT FALSE,
  read_at          TIMESTAMPTZ,
  delivered_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, notification_id)
);

-- Students table (reference)
CREATE TABLE students (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  roll_no    VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Queries Based on Stage 1 API

```sql
-- GET /api/notifications (paginated, filtered)
SELECT n.id, n.type, n.message, n.created_at, sn.is_read
FROM notifications n
JOIN student_notifications sn ON sn.notification_id = n.id
WHERE sn.student_id = $1
  AND ($2::notification_type IS NULL OR n.type = $2)
ORDER BY n.created_at DESC
LIMIT $3 OFFSET $4;

-- GET /api/notifications/:id
SELECT n.id, n.type, n.message, n.created_at, sn.is_read, sn.read_at
FROM notifications n
JOIN student_notifications sn ON sn.notification_id = n.id
WHERE n.id = $1 AND sn.student_id = $2;

-- PATCH /api/notifications/:id/read
UPDATE student_notifications
SET is_read = TRUE, read_at = NOW()
WHERE notification_id = $1 AND student_id = $2;

-- PATCH /api/notifications/read/all
UPDATE student_notifications
SET is_read = TRUE, read_at = NOW()
WHERE student_id = $1 AND is_read = FALSE;

-- GET /api/notifications/count/unread
SELECT COUNT(*) AS unread_count
FROM student_notifications
WHERE student_id = $1 AND is_read = FALSE;
```

---

### Scaling Problems & Solutions

| Problem | Cause | Solution |
|---------|-------|----------|
| Slow queries | Full table scan on large `student_notifications` | Add composite indexes |
| Write bottleneck | 50k rows inserted per broadcast | Use message queue (BullMQ/Redis) + batch inserts |
| Read overload | Every page load hits DB | Add Redis caching layer |
| Table bloat | Millions of old notifications | Partition by `created_at` (monthly) |
| Single point of failure | One DB instance | Add read replicas for SELECT queries |

**Partitioning Strategy:**
```sql
-- Partition student_notifications by month
CREATE TABLE student_notifications (
  ...
) PARTITION BY RANGE (delivered_at);

CREATE TABLE student_notifications_2026_06
  PARTITION OF student_notifications
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
```

---

# Stage 3

## Query Analysis

### Original Query
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

### Why Is This Slow?

With 50,000 students and 5,000,000 notifications, this query is slow because:

1. **No indexes** on `studentID`, `isRead`, or `createdAt` — causes a **full sequential scan** of 5M rows
2. **`SELECT *`** fetches all columns including potentially large `metadata` JSONB — unnecessary data transfer
3. **`isRead = false`** is a low-cardinality filter — most rows will be read, making an index on it alone ineffective without a composite index
4. **`ORDER BY createdAt ASC`** without an index triggers an expensive in-memory sort

**Computation cost before fix:** O(N) full scan → O(N log N) sort → extremely slow at 5M rows

---

### What to Change

```sql
-- Step 1: Add a composite index (most impactful change)
CREATE INDEX idx_student_unread_created
ON student_notifications (student_id, is_read, created_at ASC)
WHERE is_read = FALSE;  -- partial index: only indexes unread rows

-- Step 2: Rewrite query to select only needed columns
SELECT sn.notification_id, n.type, n.message, n.created_at
FROM student_notifications sn
JOIN notifications n ON n.id = sn.notification_id
WHERE sn.student_id = 1042
  AND sn.is_read = FALSE
ORDER BY n.created_at ASC;
```

**After fix:** Index seek → O(log N + K) where K = unread count for student. Dramatically faster.

---

### Advice: Should We Index Every Column?

**No — this is bad advice.** Here's why:

| Concern | Explanation |
|---------|-------------|
| **Write penalty** | Every INSERT/UPDATE/DELETE must update ALL indexes — 50k broadcast = 50k × N index updates |
| **Storage bloat** | Each index consumes significant disk space |
| **Query planner confusion** | Too many indexes can cause the optimizer to pick suboptimal execution plans |
| **Low-cardinality waste** | Indexing boolean columns like `is_read` alone is nearly useless — most rows have `is_read = false` anyway |

**Best practice:** Index only columns used in WHERE, JOIN, and ORDER BY clauses together as composite indexes. Use partial indexes where possible.

---

### Query: Placement Notifications in Last 7 Days

```sql
SELECT
  s.id AS student_id,
  s.name,
  s.email,
  n.message,
  n.created_at
FROM student_notifications sn
JOIN notifications n ON n.id = sn.notification_id
JOIN students s ON s.id = sn.student_id
WHERE n.type = 'Placement'
  AND n.created_at >= NOW() - INTERVAL '7 days'
ORDER BY n.created_at DESC;
```

---

# Stage 4

## Performance: Caching & Optimization Strategy

### Problem
Fetching notifications on every page load overwhelms the DB. With 50k students, this means thousands of simultaneous queries per minute.

### Solution 1: Redis Caching (Recommended)

Cache per-student notification lists in Redis with a TTL.

```
Key:   notifications:student:{studentId}:page:{page}
Value: JSON array of notifications
TTL:   60 seconds
```

**Implementation:**
```javascript
async function getNotifications(studentId, page) {
  const cacheKey = `notifications:student:${studentId}:page:${page}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);               // Cache HIT

  const data = await db.query(/* SQL */);               // Cache MISS
  await redis.setex(cacheKey, 60, JSON.stringify(data)); // Store
  return data;
}
```

**Invalidation:** When a student's notification is updated (read/deleted), invalidate their cache keys.

**Tradeoffs:**
| Pro | Con |
|-----|-----|
| Reduces DB load by ~90% | Stale data for up to TTL seconds |
| Sub-millisecond reads | Added infrastructure (Redis server) |
| Scales horizontally | Cache invalidation complexity |

---

### Solution 2: Pagination + Limit

Never load all notifications at once. Enforce server-side pagination.

**Tradeoffs:**
| Pro | Con |
|-----|-----|
| Immediate, zero-infrastructure win | Users must paginate |
| Reduces query result size | Doesn't help if each page query is still slow |

---

### Solution 3: DB Read Replicas

Route all SELECT queries to a read replica; only writes go to primary.

**Tradeoffs:**
| Pro | Con |
|-----|-----|
| Scales read throughput linearly | Replication lag (replica may be slightly behind) |
| Isolates read load from writes | Higher infrastructure cost |

---

### Solution 4: SSE / WebSocket Push (Avoid Polling)

Instead of fetching on page load, push new notifications to clients in real-time.

**Tradeoffs:**
| Pro | Con |
|-----|-----|
| Eliminates polling entirely | Persistent connections consume server memory |
| Instant notification delivery | Complex reconnection handling on client |

---

### Recommended Combined Strategy
1. **Redis cache** for paginated notification lists (TTL: 60s)
2. **Pagination** enforced at API level (max 50 per page)
3. **SSE** for real-time new notification delivery (avoids polling)
4. **Read replica** for SELECT queries once DB load justifies it

---

# Stage 5

## Broadcast Reliability Analysis

### Original Pseudocode Problems

```
function notify_all(student_ids: array, message: string):
  for student_id in student_ids:
    send_email(student_id, message)   # calls Email API
    save_to_db(student_id, message)   # DB insert
    push_to_app(student_id, message)  # real-time push
```

**Shortcomings:**

| Issue | Impact |
|-------|--------|
| **Synchronous loop** over 50,000 students | Takes hours to complete; blocks the entire process |
| **No error handling** | If `send_email` fails for student 200, loop halts — remaining 49,800 never notified |
| **Tight coupling** | Email, DB, and push all happen in sequence — one failure cascades |
| **No retry logic** | Failed emails are lost forever |
| **No atomicity guarantee** | Email sent but DB insert fails → inconsistent state |
| **No job tracking** | No way to know progress or resume after crash |

---

### What Happened: 200 Email Failures Midway

The `send_email` API (likely a third-party service like SendGrid) returned errors for 200 students. In the original implementation, this likely caused either:
- The loop to halt entirely (uncaught exception), OR
- Silent failure with no retry

**There is no way to recover** — we don't know which 200 failed, and there's no retry queue.

---

### Should DB save and Email send happen together (atomically)?

**No — they should NOT be tightly coupled.** Here's why:

- Email delivery is an **external side effect** — it can fail for reasons outside our control (third-party API down, rate limits)
- DB save is our **source of truth** — it should always succeed independently
- If we roll back the DB insert when email fails, the notification is lost entirely
- **Correct approach:** Save to DB first (always), then attempt email delivery asynchronously with retries

---

### Redesigned Reliable Implementation

**Architecture: Message Queue (BullMQ + Redis)**

```
HR clicks "Notify All"
        │
        ▼
POST /api/notifications/broadcast
        │
        ▼
┌─────────────────────┐
│  Enqueue Job(s)     │  ← one job per student batch (500 each)
│  in Redis/BullMQ    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Worker Pool        │  ← 10 concurrent workers
│  (processes jobs)   │
│  ① save_to_db()     │  ← always first, non-blocking
│  ② send_email()     │  ← async, with 3 retries + backoff
│  ③ push_to_app()    │  ← SSE broadcast
└─────────────────────┘
```

**Revised Pseudocode:**

```
function notify_all(student_ids: array, message: string) -> jobId:
  jobId = generate_uuid()
  batches = chunk(student_ids, size=500)          # split into batches of 500

  for batch in batches:
    enqueue_job(queue="notifications", payload={
      jobId: jobId,
      studentIds: batch,
      message: message,
      retries: 3
    })

  log("Broadcast job enqueued", { jobId, totalStudents: len(student_ids) })
  return { jobId, status: "queued" }             # return immediately (202 Accepted)


# Worker (runs concurrently, picks jobs from queue)
function process_notification_job(job):
  for student_id in job.studentIds:
    try:
      save_to_db(student_id, job.message)         # ① always save first
      log("Saved to DB", { student_id })
    catch dbError:
      log_error("DB save failed", { student_id, error: dbError })
      mark_failed(job.jobId, student_id, "db_error")
      continue                                     # skip email if DB failed

    try:
      send_email(student_id, job.message)          # ② attempt email
      log("Email sent", { student_id })
    catch emailError:
      log_error("Email failed", { student_id, error: emailError })
      enqueue_retry(student_id, job.message, attempt=1)  # ③ retry queue

    try:
      push_to_app(student_id, job.message)         # ④ SSE push (best effort)
    catch pushError:
      log_error("Push failed", { student_id, error: pushError })
      # non-critical: log and continue


# Retry worker (exponential backoff)
function process_retry(student_id, message, attempt):
  if attempt > 3:
    log_error("Max retries exceeded", { student_id })
    mark_failed_permanent(student_id)
    return

  wait(exponential_backoff(attempt))               # 2s, 4s, 8s
  try:
    send_email(student_id, message)
    log("Retry email success", { student_id, attempt })
  catch:
    enqueue_retry(student_id, message, attempt + 1)
```

---

### Key Design Decisions

| Decision | Reason |
|----------|--------|
| Save to DB before email | DB is source of truth; email is a side effect |
| Batch processing (500/batch) | Prevents memory overload; enables parallel processing |
| Separate retry queue | Isolates failures; doesn't block successful deliveries |
| Return 202 immediately | HR gets instant feedback; processing happens async |
| Job tracking (jobId) | Allows progress monitoring and audit trail |

---

# Stage 6

## Priority Inbox Implementation

### Approach

Priority score is calculated using a combination of **type weight** and **recency**:

```
Priority Score = typeWeight × recencyScore

typeWeight:
  Placement = 3 (highest)
  Result    = 2
  Event     = 1 (lowest)

recencyScore = 1 / (1 + hoursElapsed)
  → newer notifications score closer to 1.0
  → older notifications score closer to 0.0

Final Score = typeWeight × recencyScore
```

This ensures a recent Placement always outranks an old Placement, and Placements always outrank Results of similar age.

### Maintaining Top 10 Efficiently as New Notifications Arrive

Use a **Min-Heap of size N**:
- Keep a min-heap of the top 10 notifications by priority score
- For each new notification: if its score > heap minimum → evict minimum → insert new
- Time complexity: O(log N) per new notification vs O(N log N) for full re-sort
- This is efficient even with thousands of incoming notifications

See implementation in `stage6/priority_inbox.js`.

---
