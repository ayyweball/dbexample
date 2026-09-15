# Mindtrace

Mindtrace is a full-stack EdTech platform that tracks student performance and uses AI to identify underlying misconceptions instead of simply marking answers as right or wrong.

It combines practice attempts, reasoning, confidence, and hesitation data with AI-based analysis to identify possible cognitive misconceptions and generate targeted follow-up questions for remediation.

## Tech Stack

### Frontend

* React 18
* TypeScript
* Vite
* Tailwind CSS
* Lucide React
* Fetch API

### Backend

* Node.js
* Express.js
* MySQL 8
* `mysql2/promise`
* Groq API
* `groq-sdk`

### Testing

* Jest
* Supertest

## Features

* Interactive practice environment
* Student management and profiles
* Question bank with filtering and search
* Attempt and performance tracking
* Confidence and hesitation telemetry
* AI-powered misconception detection
* Misconception repository
* AI-generated remediation questions
* Follow-up remediation attempts
* Student-level performance analytics
* Platform-wide analytics
* API health monitoring
* Graceful handling of AI/API failures

## How It Works

When a student submits an answer:

1. The attempt is validated and saved to MySQL.
2. The answer is evaluated against the correct answer stored in the database.
3. The student's answer and reasoning are sent to Groq for misconception analysis.
4. If a misconception is detected, it is stored in the database.
5. A targeted follow-up question is generated for that misconception.
6. The student can attempt the remediation question through the Remediation Center.

The original attempt is always saved before AI processing, so a Groq failure does not result in lost student data.

## Project Structure

```text
mindtrace/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   └── practice/
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── PracticeStudioPage.tsx
│   │   │   ├── MisconceptionsPage.tsx
│   │   │   ├── RemediationCenterPage.tsx
│   │   │   ├── QuestionBankPage.tsx
│   │   │   ├── StudentsPage.tsx
│   │   │   ├── StudentDetailPage.tsx
│   │   │   └── AnalyticsPage.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   └── package.json
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── services/
│   ├── middleware/
│   ├── routes/
│   ├── app.js
│   └── server.js
│
├── scripts/
│   └── initDb.js
├── tests/
│   └── api.test.js
├── schema.sql
├── seed.sql
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## API

Base URL:

```text
http://localhost:5000/api
```

### Health

```http
GET /api/health
```

### Students

```http
GET    /api/students
GET    /api/students/:id
GET    /api/students/:id/summary
GET    /api/students/:id/attempts
GET    /api/students/:id/misconceptions
POST   /api/students
```

`GET /api/students` supports `?search=`.

### Questions

```http
GET    /api/questions
GET    /api/questions/meta/subjects
GET    /api/questions/:id
POST   /api/questions
```

Supported filters:

```text
?subject=
?topic=
?difficulty=
?search=
```

### Attempts

```http
GET    /api/attempts
GET    /api/attempts/:id
POST   /api/attempts
```

Supported filters:

```text
?student_id=
?question_id=
?is_correct=
```

`POST /api/attempts` saves the attempt and triggers the AI misconception analysis.

### Misconceptions

```http
GET /api/misconceptions
GET /api/misconceptions/:id
```

Supported filters:

```text
?student_id=
?skill_area=
```

### Follow-up Questions

```http
GET /api/followup-questions
GET /api/followup-attempts
POST /api/followup-attempts
```

### Analytics

```http
GET /api/stats/overview
```

## Setup

### Requirements

* Node.js 18+
* MySQL 8+
* Groq API key

### Backend

Install dependencies:

```bash
npm install
```

Create the environment file:

**Windows:**

```powershell
Copy-Item .env.example .env
```

**macOS/Linux:**

```bash
cp .env.example .env
```

Configure `.env`:

```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=student

GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-20b
```

Initialize the database:

```bash
npm run db:init
```

Start the backend:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
```

Create the frontend environment file:

```bash
cp .env.example .env
```

Set:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

## Testing

From the project root:

```bash
npm test
```

The test suite covers API routing, validation, error handling, misconception detection, and Groq failure scenarios.

Groq calls are mocked during testing, so the tests do not depend on the live API.

## AI Failure Handling

AI analysis is not required for an attempt to be saved.

If Groq is unavailable, unconfigured, or returns an error, the attempt is still stored and the API returns a successful `201 Created` response with:

```json
{
  "analyzed": false,
  "message": "AI analysis unavailable"
}
```

This keeps the core learning data independent of the AI service.

## Database

The database schema is defined in `schema.sql` and initial data is provided in `seed.sql`.

Main entities include:

* Students
* Questions
* Attempts
* Misconceptions
* Follow-up Questions
* Follow-up Attempts

To inspect recent data:

```sql
USE student;

SELECT * 
FROM attempts 
ORDER BY attempt_id DESC 
LIMIT 1;

SELECT * 
FROM misconceptions 
ORDER BY misconception_id DESC 
LIMIT 1;

SELECT * 
FROM follow_up_questions 
ORDER BY followup_id DESC 
LIMIT 1;
```

## Environment Variables

Do not commit `.env` files or API keys to the repository.

Backend:

```text
PORT
NODE_ENV
CORS_ORIGIN
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
GROQ_API_KEY
GROQ_MODEL
```

Frontend:

```text
VITE_API_URL
```

## Status

Mindtrace is currently under active development.
