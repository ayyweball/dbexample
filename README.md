# Secure the Repo — Student Learning & AI Misconception Remediation Platform

A full-stack EdTech platform featuring a **Node.js + Express + MySQL** backend and a **React + TypeScript + Tailwind CSS** frontend, integrated with the **Groq API** (`groq-sdk`) for real-time cognitive misconception diagnosis and automated remediation pathways.

---

## Tech Stack

### Frontend
- **Framework:** React (v18) + TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS + Lucide React Icons
- **HTTP Client:** Fetch API with typed service layer

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js (v4)
- **Database:** MySQL (v8.0+)
- **Driver:** `mysql2/promise` (connection pooling with parameterized queries)
- **AI Engine:** Groq API (`groq-sdk`) with structured diagnostic prompts

---

## Repository Structure

```
dbex/
├── frontend/                            # React + TypeScript + Tailwind Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/                  # Badge, StatCard, Modal, FeedbackStates
│   │   │   ├── layout/                  # Navbar (with Live API health), Sidebar
│   │   │   └── practice/                # TelemetryTimer, AiMisconceptionCard
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx        # KPI metrics, subject volume, top misconceptions
│   │   │   ├── PracticeStudioPage.tsx   # Interactive solver with real-time AI diagnosis
│   │   │   ├── MisconceptionsPage.tsx   # Repository of cognitive reasoning flaws
│   │   │   ├── RemediationCenterPage.tsx# Follow-up remediation test solver
│   │   │   ├── QuestionBankPage.tsx     # Question bank browsing and creation
│   │   │   ├── StudentsPage.tsx         # Student roster and registration
│   │   │   ├── StudentDetailPage.tsx    # Individual student diagnostic profile
│   │   └── AnalyticsPage.tsx        # Platform-wide cognitive analytics
│   │   ├── services/
│   │   │   └── api.ts                   # Centralized API service consuming backend
│   │   ├── types/
│   │   │   └── api.ts                   # TypeScript interfaces matching backend models
│   │   ├── App.tsx                      # Main app shell with stateful navigation
│   │   └── main.tsx
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── src/                                 # Node.js + Express Backend
│   ├── config/                          # MySQL connection pool configuration
│   ├── controllers/                     # Controllers (students, questions, attempts, etc.)
│   ├── services/                        # Groq misconception analysis service
│   ├── middleware/                      # Centralized error handler & 404
│   ├── routes/                          # API route definitions
│   ├── app.js                           # Express application setup
│   └── server.js                        # HTTP server entrypoint
├── scripts/
│   └── initDb.js                        # Optional manual DB setup script
├── tests/
│   └── api.test.js                      # Automated API, validation & Groq mock tests
├── schema.sql                           # Database schema definition (source of truth)
├── seed.sql                             # Initial questions & sample data (source of truth)
├── .env.example                         # Backend environment variables template
├── .gitignore
├── package.json
└── README.md
```

---

## Step-by-Step Setup Guide

### 1. Backend Setup

#### 1.1 Install Backend Dependencies
```bash
npm install
```

#### 1.2 Configure Backend Environment Variables
Copy `.env.example` to `.env`:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Linux / macOS:**
```bash
cp .env.example .env
```

Open `.env` and fill in your MySQL credentials and Groq API key:
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=student

# Groq AI Configuration
GROQ_API_KEY=gsk_...your_groq_api_key_here...
GROQ_MODEL=openai/gpt-oss-20b
```

#### 1.3 Initialize the MySQL Database
```bash
npm run db:init
```
*(Executes `schema.sql` to create database and tables, and `seed.sql` to populate sample questions and students).*

#### 1.4 Start the Backend Server
```bash
npm run dev
```
Backend runs at: `http://localhost:5000` (API Base: `http://localhost:5000/api`)

---

### 2. Frontend Setup

#### 2.1 Install Frontend Dependencies
```bash
cd frontend
npm install
```

#### 2.2 Configure Frontend Environment Variables
Copy `frontend/.env.example` to `frontend/.env`:

```bash
# Inside frontend/ directory:
cp .env.example .env
```

Ensure `frontend/.env` contains:
```env
VITE_API_URL=http://localhost:5000/api
```

#### 2.3 Start the Frontend Development Server
```bash
npm run dev
```
Frontend runs at: `http://localhost:5173`

---

## 3. Running Automated Backend Tests

```bash
# In project root:
npm test
```
Executes 15 automated test suites covering:
- API routing & HTTP error translation
- Parameter validation rules (difficulty enum, confidence range `0.00-1.00`, non-negative hesitation)
- Mocked Groq misconception detection
- Mocked Groq failure/offline fallback (guarantees student attempt is preserved with 201)

---

## AI Misconception Detection & Remediation Flow

```text
React Frontend (Practice Studio)
      ↓
POST /api/attempts
      ↓
Step 1: Attempt is saved to MySQL `attempts` table FIRST (authoritative correct_answer evaluated)
      ↓
Step 2: Groq API analyzes question, correct answer, student answer, and student reasoning
      ↓
Step 3: If misconception is diagnosed:
        → Inserts diagnosed misconception into `misconceptions` table
        → Generates & inserts targeted remediation question into `follow_up_questions` table
      ↓
Step 4: Returns HTTP 201 with attempt data + `ai_analysis`
      ↓
React Frontend renders Cognitive Diagnostic Card + Follow-up Remediation Challenge
```

> **Resilience Guarantee:** If Groq is unconfigured, times out, or encounters an API error, the student's attempt is **never rolled back or lost**. The endpoint returns `201 Created` with `ai_analysis: { analyzed: false, message: "..." }`.

---

## API Endpoints Reference

Base URL: `http://localhost:5000/api`

| Module | Endpoint | Description |
| :--- | :--- | :--- |
| **Health** | `GET /api/health` | Backend status & live MySQL ping check |
| **Stats** | `GET /api/stats/overview` | Platform-wide totals, subject breakdown & top misconceptions |
| **Students** | `GET /api/students` | List all students (`?search=`) |
| | `GET /api/students/:id` | Get single student details |
| | `GET /api/students/:id/summary` | Student accuracy, telemetry averages, subject stats |
| | `GET /api/students/:id/attempts` | Student's full attempt history |
| | `GET /api/students/:id/misconceptions` | Student's diagnosed misconceptions |
| | `POST /api/students` | Register new student (`name`, `email`) |
| **Questions** | `GET /api/questions` | List questions (`?subject=`, `?topic=`, `?difficulty=`, `?search=`) |
| | `GET /api/questions/meta/subjects` | Unique subjects and topics list |
| | `GET /api/questions/:id` | Get question by ID |
| | `POST /api/questions` | Add question (`subject`, `topic`, `question_text`, `correct_answer`, `difficulty`) |
| **Attempts** | `GET /api/attempts` | List attempts (`?student_id=`, `?question_id=`, `?is_correct=`) |
| | `GET /api/attempts/:id` | Get attempt with student, question, misconceptions & follow-up attempts |
| | `POST /api/attempts` | Submit practice attempt & trigger AI diagnostic analysis |
| **Misconceptions**| `GET /api/misconceptions` | List diagnosed misconceptions (`?student_id=`, `?skill_area=`) |
| | `GET /api/misconceptions/:id` | Get misconception details with linked follow-up question |
| **Follow-up** | `GET /api/followup-questions` | List targeted remediation questions |
| | `GET /api/followup-attempts` | List remediation attempt resolutions |
| | `POST /api/followup-attempts` | Submit answer to remediation question |

---

## Verifying in MySQL

```sql
USE student;

-- View the latest student attempt
SELECT * FROM attempts ORDER BY attempt_id DESC LIMIT 1;

-- View the AI-diagnosed misconception
SELECT * FROM misconceptions ORDER BY misconception_id DESC LIMIT 1;

-- View the generated follow-up remediation question
SELECT * FROM follow_up_questions ORDER BY followup_id DESC LIMIT 1;
```