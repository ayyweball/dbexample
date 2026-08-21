# Student Learning & Misconception Remediation API

A clean, modular REST API backend built with **Node.js**, **Express.js**, **MySQL** (`mysql2/promise`), and **OpenAI API**. Designed for educational analytics, tracking student learning attempts, diagnosing cognitive misconceptions in student reasoning using AI, and delivering targeted remediation follow-up questions.

---

## Tech Stack
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js (v4)
- **Database:** MySQL (v8.0+)
- **Driver:** `mysql2/promise` (connection pooling with parameterized queries)
- **AI Integration:** OpenAI API (`openai` SDK) with structured outputs
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
│   │   ├── attemptController.js         # Attempt logging, AI integration & telemetry
│   │   ├── misconceptionController.js   # Misconception diagnosis tracking
│   │   ├── followupQuestionController.js # Remediation follow-up questions
│   │   ├── followupAttemptController.js  # Follow-up attempt tracking
│   │   ├── statsController.js           # Platform-wide analytics
│   │   └── healthController.js          # Health check endpoint
│   ├── services/
│   │   └── aiService.js                 # OpenAI misconception analysis & schema sanitization
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
│   └── api.test.js                      # Automated API, validation & AI mock tests
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
Copy `.env.example` to create your local `.env` file:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Linux / macOS:**
```bash
cp .env.example .env
```

Open `.env` and fill in your MySQL credentials and OpenAI API Key:
```env
# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=student

# OpenAI Configuration
OPENAI_API_KEY=sk-...your_openai_api_key_here...
OPENAI_MODEL=gpt-4o-mini
```

---

### 3. Initialize the MySQL Database

You can initialize the database using either the **Node script** or the **MySQL CLI**:

#### Option A: Using the built-in Node command (Recommended & cross-platform)
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

Run the built-in test suite to verify routing, validation rules, error handling, and mocked OpenAI detection flows:
```bash
npm test
```

---

## AI Misconception Detection & Remediation Flow

When a student submits an attempt via `POST /api/attempts`:

```text
React Frontend
      ↓
POST /api/attempts
      ↓
Step 1: Attempt is saved to MySQL `attempts` table FIRST (authoritative correct_answer evaluated)
      ↓
Step 2: OpenAI analyzes question, correct answer, student answer, and student reasoning
      ↓
Step 3: If misconception is diagnosed:
        → Inserts diagnosed misconception into `misconceptions` table
        → Generates & inserts targeted remediation question into `follow_up_questions` table
      ↓
Step 4: Returns HTTP 201 with attempt data + `ai_analysis`
```

> **Resilience Guarantee:** If OpenAI is unconfigured, times out, or encounters an API error, the student's attempt is **never rolled back or lost**. The endpoint returns `201 Created` with `ai_analysis: { analyzed: false, message: "..." }`.

---

## API Documentation & Endpoints

Base URL: `http://localhost:5000/api`

### Health Check
- **`GET /api/health`** — Checks server status and MySQL connection.

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
| `POST` | `/api/attempts` | Submit attempt and run AI misconception diagnosis |
| `PUT` | `/api/attempts/:id` | Update attempt details |
| `DELETE` | `/api/attempts/:id` | Delete attempt |

#### Sample Request to `POST /api/attempts` (Intentionally Incorrect with Misconception Reasoning):
```json
{
  "student_id": 1,
  "question_id": 1,
  "answer": "10",
  "reasoning": "For 2x + 6 = 14, I added 6 to 14 to get 20, then divided 20 by 2 to get x = 10.",
  "hesitation_seconds": 15.2,
  "revision_count": 1
}
```

#### Sample Response:
```json
{
  "success": true,
  "message": "Attempt recorded successfully",
  "data": {
    "attempt_id": 1,
    "student_id": 1,
    "student_name": "Rahul",
    "question_id": 1,
    "subject": "Mathematics",
    "topic": "Linear Equations",
    "question_text": "Solve 2x + 6 = 14.",
    "correct_answer": "4",
    "answer": "10",
    "reasoning": "For 2x + 6 = 14, I added 6 to 14 to get 20, then divided 20 by 2 to get x = 10.",
    "is_correct": false,
    "hesitation_seconds": 15.2,
    "revision_count": 1,
    "timestamp": "2026-08-22T03:00:00.000Z",
    "ai_analysis": {
      "available": true,
      "analyzed": true,
      "model": "gpt-4o-mini",
      "has_misconception": true,
      "misconception": {
        "misconception_id": 1,
        "attempt_id": 1,
        "type": "Inverse Operation / Sign Transposition Error",
        "description": "The student added 6 instead of subtracting 6 when isolating the variable term across the equation.",
        "confidence": 0.95,
        "skill_area": "Algebraic Manipulation"
      },
      "follow_up": {
        "followup_id": 1,
        "misconception_id": 1,
        "question_text": "Solve 3x + 9 = 24. What is the value of x?",
        "expected_concept": "Subtraction property of equality (inverse operations)",
        "difficulty": "Easy"
      }
    }
  }
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

## Verifying in MySQL

After submitting an attempt with a misconception, you can verify the persisted records in MySQL:

```sql
USE student;

-- View the saved attempt
SELECT * FROM attempts ORDER BY attempt_id DESC LIMIT 1;

-- View the AI-diagnosed misconception
SELECT * FROM misconceptions ORDER BY misconception_id DESC LIMIT 1;

-- View the generated remediation follow-up question
SELECT * FROM follow_up_questions ORDER BY followup_id DESC LIMIT 1;
```