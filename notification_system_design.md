# Notification System Design

## Overview

A scalable notification system that supports multiple channels (Email, SMS, Push, In-App) with logging middleware to track all incoming API requests.

---

## Architecture Diagram

```
Client / Frontend
       │
       ▼
┌─────────────────────┐
│   API Gateway       │  ← REST API (Express)
│  + Logging MW       │  ← logs method, URL, status, response time
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Notification       │
│  Service            │
│  (Controller +      │
│   Business Logic)   │
└────────┬────────────┘
         │
   ┌─────┴──────┐
   ▼            ▼
Email         In-App / Push
(Nodemailer)  (WebSocket / DB)
```

---

## Components

### 1. Logging Middleware
- Intercepts every API request
- Logs: timestamp, HTTP method, URL, status code, response time (ms)
- Stored in: console + `logs/app.log` file

### 2. Notification Service
- Accepts notification requests via REST API
- Supports types: `email`, `sms`, `push`, `in-app`
- Queues and dispatches notifications to appropriate handlers

### 3. Backend (`notification_app_be`)
- **Framework**: Node.js + Express
- **Routes**:
  - `POST /api/notifications` — create & send notification
  - `GET /api/notifications` — get all notifications
  - `GET /api/notifications/:id` — get single notification
  - `PATCH /api/notifications/:id/read` — mark as read
- **Database**: In-memory store (can be extended to MongoDB/PostgreSQL)

### 4. Frontend (`notification_app_fe`)
- **Framework**: React
- **Features**:
  - Notification bell with unread count badge
  - Notification list panel
  - Mark as read / Mark all as read
  - Real-time polling every 5 seconds

---

## Data Model

```json
{
  "id": "uuid",
  "type": "email | sms | push | in-app",
  "recipient": "user@example.com",
  "title": "Notification Title",
  "message": "Notification body content",
  "status": "pending | sent | failed",
  "read": false,
  "createdAt": "2026-06-11T12:00:00Z"
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notifications` | Create & send a notification |
| GET | `/api/notifications` | List all notifications |
| GET | `/api/notifications/:id` | Get a specific notification |
| PATCH | `/api/notifications/:id/read` | Mark notification as read |
| DELETE | `/api/notifications/:id` | Delete a notification |

---

## Logging Middleware Design

```js
// Every request gets logged automatically
[2026-06-11T12:00:00Z] POST /api/notifications → 201 (34ms)
[2026-06-11T12:00:01Z] GET  /api/notifications → 200 (12ms)
```

**Log Fields:**
- `timestamp` — ISO 8601 datetime
- `method` — HTTP verb (GET, POST, etc.)
- `url` — request path
- `statusCode` — HTTP response status
- `responseTime` — time taken in milliseconds
- `ip` — client IP address

---

## Scalability Considerations

- **Message Queue**: Add Redis/RabbitMQ to decouple sending from API response
- **Rate Limiting**: Prevent notification spam per user
- **Retry Logic**: Auto-retry failed notifications (3 attempts with backoff)
- **Database**: Switch to MongoDB or PostgreSQL for persistence
- **Microservices**: Split email/SMS/push into separate services

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express |
| Frontend | React |
| Styling | CSS / Tailwind |
| Logging | Custom Middleware + fs (file logging) |
| Storage | In-memory (extendable to MongoDB) |
