# Student Learning & Misconception Remediation API

A clean, modular REST API backend built with **Node.js**, **Express.js**, and **MySQL** (`mysql2/promise`). Designed for educational analytics, tracking student learning attempts, diagnosing misconceptions, and delivering targeted remediation follow-up questions.

---

## Tech Stack
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js (v4)
- **Database:** MySQL (v8.0+)
- **Driver:** `mysql2/promise` (connection pooling with parameterized queries)
- **CORS:** Configured for React + Vite + Tailwind frontend

---

## Project Structure

```
dbex/
├── src/
│   ├── config/
│   │   └── db.js                        # MySQL connection pool configuration
│   ├── controllers/
│   │   ├── studentController.js         # Student CRUD, attempts, misconceptions, summary
│   │   ├── questionController.js        # Question bank CRUD & subject/topic grouping
│   │   ├── attemptController.js         # Attempt logging & telemetry
│   │   ├── misconceptionController.js   # Misconception diagnosis tracking
│   │   ├── followupQuestionController.js # Remediation follow-up questions
│   │   ├── followupAttemptController.js  # Follow-up attempt tracking
│   │   ├── statsController.js           # Platform-wide analytics
│   │   └── healthController.js          # Health check endpoint
│   ├── middleware/
│   │   ├── errorHandler.js              # Centralized error handler & MySQL error mapping
│   │   └── notFound.js                  # 404 handler
│   ├── routes/
│   │   ├── healthRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── questionRoutes.js
│   │   ├── attemptRoutes.js
│   │   ├── misconceptionRoutes.js
│   │   ├── followupQuestionRoutes.js
│   │   ├── followupAttemptRoutes.js
│   │   ├── statsRoutes.js
│   │   └── index.js                     # Root API router (/api)
│   ├── app.js                           # Express application setup
│   └── server.js                        # HTTP server entrypoint
├── scripts/
│   └── initDb.js                        # Optional manual DB setup helper script
├── tests/
│   └── api.test.js                      # Automated API & validation tests
├── schema.sql                           # Database schema definition (source of truth)
├── seed.sql                             # Initial sample questions & data (source of truth)
├── .env.example                         # Template for environment variables
├── .gitignore
├── package.json
└── README.md
```

---

## Step-by-Step Setup Guide

### 1. Install Dependencies
Ensure you have [Node.js](https://nodejs.org/) (v18 or higher) installed:

```bash
npm install
```

---

### 2. Configure Environment Variables
Copy `.env.example` to create your `.env` file:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Linux / macOS:**
```bash
cp .env.example .env
```

Open `.env` and set your MySQL credentials:
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=student
```

---

### 3. Initialize the MySQL Database

You can initialize the database using either the **Node script** or the **MySQL CLI**:

#### Option A: Using the built-in Node script (Recommended & cross-platform)
Once you have configured `.env` with your MySQL credentials, run:
```bash
npm run db:init
```
*(This reads `schema.sql` to create the database/tables and `seed.sql` to insert sample questions and students).*

#### Option B: Using MySQL CLI
```bash
# 1. Run schema.sql (creates 'student' database and all tables)
mysql -u root -p < schema.sql

# 2. Run seed.sql (populates question bank and sample data)
mysql -u root -p < seed.sql
```

---

### 4. Start the Backend

#### Development mode (with auto-reload):
```bash
npm run dev
```

#### Production mode:
```bash
npm start
```

When started, you should see:
```text
=================================================
  Backend Server is running on port 5000
  Environment: development
  API Health: http://localhost:5000/api/health
=================================================
[Database] Successfully connected to MySQL database: 'student'
```

---

### 5. Running Automated Tests

Run the built-in test suite to verify routing, validation rules, and error handling:
```bash
npm test
```

---

## API Documentation & Endpoints

Base URL: `http://localhost:5000/api`

### Health Check
- **`GET /api/health`** — Checks server status and MySQL connection.
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-08-22T02:40:00.000Z",
    "uptime_seconds": 12.34,
    "database": {
      "connected": true
    },
    "environment": "development"
  }
  ```

---

### Students (`/api/students`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/students` | List students (filter with `?search=rahul`) |
| `GET` | `/api/students/:id` | Get student details |
| `POST` | `/api/students` | Register student (`{ "name": "...", "email": "..." }`) |
| `PUT` | `/api/students/:id` | Update student (`{ "name": "...", "email": "..." }`) |
| `DELETE` | `/api/students/:id` | Delete student |
| `GET` | `/api/students/:id/attempts` | Full history of attempts made by student |
| `GET` | `/api/students/:id/misconceptions` | All diagnosed misconceptions for student |
| `GET` | `/api/students/:id/summary` | Performance stats (accuracy %, topic breakdown) |

---

### Questions (`/api/questions`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/questions` | List questions (filter: `?subject=`, `?topic=`, `?difficulty=`, `?search=`) |
| `GET` | `/api/questions/meta/subjects` | List unique subjects and topics for UI filters |
| `GET` | `/api/questions/:id` | Get question by ID |
| `POST` | `/api/questions` | Create question (`subject`, `topic`, `question_text`, `correct_answer`, `difficulty`) |
| `PUT` | `/api/questions/:id` | Update question |
| `DELETE` | `/api/questions/:id` | Delete question |
| `GET` | `/api/questions/:id/attempts` | List all attempts made on this question |

---

### Attempts (`/api/attempts`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/attempts` | List attempts (filter: `?student_id=`, `?question_id=`, `?is_correct=`) |
| `GET` | `/api/attempts/:id` | Get attempt with student, question, misconceptions & follow-up attempts |
| `POST` | `/api/attempts` | Record an attempt |
| `PUT` | `/api/attempts/:id` | Update attempt details |
| `DELETE` | `/api/attempts/:id` | Delete attempt |

#### Sample Attempt Request (`POST /api/attempts`):
```json
{
  "student_id": 1,
  "question_id": 1,
  "answer": "4",
  "reasoning": "Subtracted 6 from 14 to get 8, then divided by 2 to get 4.",
  "is_correct": true,
  "hesitation_seconds": 12.5,
  "revision_count": 0
}
```

---

### Misconceptions (`/api/misconceptions`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/misconceptions` | List misconceptions (`?attempt_id=`, `?student_id=`, `?type=`, `?skill_area=`) |
| `GET` | `/api/misconceptions/:id` | Get misconception with context & follow-up questions |
| `POST` | `/api/misconceptions` | Record diagnosed misconception |
| `PUT` | `/api/misconceptions/:id` | Update misconception |
| `DELETE` | `/api/misconceptions/:id` | Delete misconception |

#### Sample Misconception Request (`POST /api/misconceptions`):
```json
{
  "attempt_id": 1,
  "type": "Sign Inversion Error",
  "description": "Student subtracted when transposition required addition.",
  "confidence": 0.85,
  "skill_area": "Algebraic Manipulation"
}
```

---

### Follow-up Questions (`/api/followup-questions`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/followup-questions` | List follow-up questions (`?misconception_id=`, `?difficulty=`) |
| `GET` | `/api/followup-questions/:id` | Get follow-up question by ID |
| `POST` | `/api/followup-questions` | Create targeted remediation question |
| `PUT` | `/api/followup-questions/:id` | Update follow-up question |
| `DELETE` | `/api/followup-questions/:id` | Delete follow-up question |

---

### Follow-up Attempts (`/api/followup-attempts`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/followup-attempts` | List follow-up attempts (`?student_id=`, `?followup_id=`, `?attempt_id=`) |
| `GET` | `/api/followup-attempts/:id` | Get follow-up attempt by ID |
| `POST` | `/api/followup-attempts` | Submit answer to remediation question |
| `PUT` | `/api/followup-attempts/:id` | Update follow-up attempt |
| `DELETE` | `/api/followup-attempts/:id` | Delete follow-up attempt |

---

### Analytics Overview (`/api/stats`)
- **`GET /api/stats/overview`** — Platform-wide metrics including total students, questions, attempts, accuracy %, questions by subject, and top misconceptions.

---

## Testing Endpoints via PowerShell or cURL

### 1. Check Health
```bash
curl http://localhost:5000/api/health
```

### 2. Get All Questions
```bash
curl http://localhost:5000/api/questions
```

### 3. Create a New Student
```bash
curl -X POST http://localhost:5000/api/students \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Aanya Sharma\",\"email\":\"aanya@example.com\"}"
```

### 4. Record a Learning Attempt
```bash
curl -X POST http://localhost:5000/api/attempts \
  -H "Content-Type: application/json" \
  -d "{\"student_id\":1,\"question_id\":1,\"answer\":\"4\",\"reasoning\":\"2x = 8, so x = 4\",\"is_correct\":true,\"hesitation_seconds\":8.5,\"revision_count\":0}"
```

### 5. Get Analytics Overview
```bash
curl http://localhost:5000/api/stats/overview
```