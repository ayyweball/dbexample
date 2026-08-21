const { test, describe, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const { sanitizeAiResponse, analyzeAttempt, setOpenAiClient } = require('../src/services/aiService');

describe('API Routing & Validation Tests', () => {
  test('GET / should return welcome message and documentation links', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'online');
    assert.ok(res.body.documentation);
    assert.strictEqual(res.body.documentation.health, 'GET /api/health');
  });

  test('GET /api/health should respond with health status payload', async () => {
    const res = await request(app).get('/api/health');
    assert.ok(res.statusCode === 200 || res.statusCode === 503);
    assert.ok(res.body.status === 'healthy' || res.body.status === 'degraded');
    assert.ok(res.body.database !== undefined);
  });

  test('GET /unknown-route should return 404 Not Found', async () => {
    const res = await request(app).get('/non-existent-endpoint');
    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.includes('Route not found'));
  });

  test('POST /api/students with missing fields should return 400 Bad Request', async () => {
    const res = await request(app).post('/api/students').send({ name: 'Only Name' });
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.includes('email is required'));
  });

  test('POST /api/questions with invalid difficulty should return 400 Bad Request', async () => {
    const res = await request(app).post('/api/questions').send({
      subject: 'Math',
      topic: 'Algebra',
      question_text: 'What is x?',
      correct_answer: '5',
      difficulty: 'SuperHard', // Not in Easy, Medium, Hard
    });
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.includes('Difficulty must be one of: Easy, Medium, Hard'));
  });

  test('POST /api/attempts with negative hesitation_seconds should return 400 Bad Request', async () => {
    const res = await request(app).post('/api/attempts').send({
      student_id: 1,
      question_id: 1,
      answer: '4',
      hesitation_seconds: -10, // Invalid CHECK constraint
    });
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.includes('hesitation_seconds must be a non-negative number'));
  });

  test('POST /api/misconceptions with invalid confidence > 1.0 should return 400 Bad Request', async () => {
    const res = await request(app).post('/api/misconceptions').send({
      attempt_id: 1,
      type: 'Algebraic Slip',
      confidence: 1.5, // Invalid CHECK constraint (0.00 to 1.00)
    });
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.error.includes('confidence must be a number between 0.00 and 1.00'));
  });
});

describe('AI Service & Misconception Analysis Tests', () => {
  afterEach(() => {
    setOpenAiClient(null);
  });

  test('sanitizeAiResponse: should handle valid misconception and follow-up correctly', () => {
    const rawAiOutput = {
      has_misconception: true,
      misconception: {
        type: 'Sign Transposition Error',
        description: 'Student added 6 instead of subtracting 6 when moving across equals sign.',
        confidence: 0.95,
        skill_area: 'Linear Equations',
      },
      follow_up: {
        question_text: 'Solve 2x + 10 = 20.',
        expected_concept: 'Subtraction property of equality',
        difficulty: 'Easy',
      },
    };

    const sanitized = sanitizeAiResponse(rawAiOutput, 'Medium');
    assert.strictEqual(sanitized.has_misconception, true);
    assert.strictEqual(sanitized.misconception.type, 'Sign Transposition Error');
    assert.strictEqual(sanitized.misconception.confidence, 0.95);
    assert.strictEqual(sanitized.follow_up.question_text, 'Solve 2x + 10 = 20.');
    assert.strictEqual(sanitized.follow_up.difficulty, 'Easy');
  });

  test('sanitizeAiResponse: should sanitize and clamp confidence values', () => {
    const rawAiOutputOver = {
      has_misconception: true,
      misconception: {
        type: 'Test Over',
        confidence: 1.85, // over 1.00
      },
      follow_up: { question_text: 'Q1' },
    };
    const sanitizedOver = sanitizeAiResponse(rawAiOutputOver);
    assert.strictEqual(sanitizedOver.misconception.confidence, 1.00);

    const rawAiOutputUnder = {
      has_misconception: true,
      misconception: {
        type: 'Test Under',
        confidence: -0.5, // negative
      },
      follow_up: { question_text: 'Q2' },
    };
    const sanitizedUnder = sanitizeAiResponse(rawAiOutputUnder);
    assert.strictEqual(sanitizedUnder.misconception.confidence, 0.85); // fallback safe confidence
  });

  test('sanitizeAiResponse: should fallback invalid difficulty to allowed values', () => {
    const rawAiOutput = {
      has_misconception: true,
      misconception: { type: 'Test', confidence: 0.9 },
      follow_up: {
        question_text: 'Followup Q',
        difficulty: 'ExtremeHard', // Invalid for MySQL schema
      },
    };
    const sanitized = sanitizeAiResponse(rawAiOutput, 'Medium');
    assert.strictEqual(sanitized.follow_up.difficulty, 'Medium');
  });

  test('sanitizeAiResponse: should handle has_misconception = false', () => {
    const rawAiOutput = {
      has_misconception: false,
      misconception: null,
      follow_up: null,
    };
    const sanitized = sanitizeAiResponse(rawAiOutput);
    assert.strictEqual(sanitized.has_misconception, false);
    assert.strictEqual(sanitized.misconception, null);
    assert.strictEqual(sanitized.follow_up, null);
  });

  test('analyzeAttempt: should safely return unavailable when OPENAI_API_KEY is not set', async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      const result = await analyzeAttempt({
        question_text: 'Solve 2x + 6 = 14',
        subject: 'Mathematics',
        topic: 'Linear Equations',
        difficulty: 'Easy',
        correct_answer: '4',
        student_answer: '10',
        student_reasoning: 'I added 6 and 14 to get 20, then divided by 2 to get 10.',
      });

      assert.strictEqual(result.available, false);
      assert.strictEqual(result.analyzed, false);
      assert.strictEqual(result.has_misconception, false);
      assert.ok(result.message.includes('OPENAI_API_KEY is not configured'));
    } finally {
      if (originalKey) process.env.OPENAI_API_KEY = originalKey;
    }
  });

  test('analyzeAttempt: should parse mocked OpenAI completion with misconception', async () => {
    process.env.OPENAI_API_KEY = 'test-mock-key';

    const mockClient = {
      chat: {
        completions: {
          create: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    has_misconception: true,
                    misconception: {
                      type: 'Sign Transposition Error',
                      description: 'Added 6 instead of subtracting 6.',
                      confidence: 0.92,
                      skill_area: 'Linear Equations',
                    },
                    follow_up: {
                      question_text: 'Solve 2x + 8 = 16',
                      expected_concept: 'Inverse operation',
                      difficulty: 'Easy',
                    },
                  }),
                },
              },
            ],
          }),
        },
      },
    };

    setOpenAiClient(mockClient);

    try {
      const result = await analyzeAttempt({
        question_text: 'Solve 2x + 6 = 14',
        subject: 'Mathematics',
        topic: 'Linear Equations',
        difficulty: 'Easy',
        correct_answer: '4',
        student_answer: '10',
        student_reasoning: '2x = 14 + 6 = 20, so x = 10',
      });

      assert.strictEqual(result.available, true);
      assert.strictEqual(result.analyzed, true);
      assert.strictEqual(result.has_misconception, true);
      assert.strictEqual(result.misconception.type, 'Sign Transposition Error');
      assert.strictEqual(result.misconception.confidence, 0.92);
      assert.strictEqual(result.follow_up.question_text, 'Solve 2x + 8 = 16');
    } finally {
      delete process.env.OPENAI_API_KEY;
    }
  });

  test('analyzeAttempt: should parse mocked OpenAI completion with NO misconception', async () => {
    process.env.OPENAI_API_KEY = 'test-mock-key';

    const mockClient = {
      chat: {
        completions: {
          create: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    has_misconception: false,
                    misconception: null,
                    follow_up: null,
                  }),
                },
              },
            ],
          }),
        },
      },
    };

    setOpenAiClient(mockClient);

    try {
      const result = await analyzeAttempt({
        question_text: 'Solve 2x + 6 = 14',
        subject: 'Mathematics',
        topic: 'Linear Equations',
        difficulty: 'Easy',
        correct_answer: '4',
        student_answer: '4',
        student_reasoning: '2x = 8, so x = 4',
      });

      assert.strictEqual(result.available, true);
      assert.strictEqual(result.analyzed, true);
      assert.strictEqual(result.has_misconception, false);
      assert.strictEqual(result.misconception, null);
      assert.strictEqual(result.follow_up, null);
    } finally {
      delete process.env.OPENAI_API_KEY;
    }
  });

  test('analyzeAttempt: should handle OpenAI network/API error gracefully without throwing', async () => {
    process.env.OPENAI_API_KEY = 'test-mock-key';

    const mockClient = {
      chat: {
        completions: {
          create: async () => {
            throw new Error('Connection timeout to api.openai.com');
          },
        },
      },
    };

    setOpenAiClient(mockClient);

    try {
      const result = await analyzeAttempt({
        question_text: 'Solve 2x + 6 = 14',
        subject: 'Mathematics',
        topic: 'Linear Equations',
        difficulty: 'Easy',
        correct_answer: '4',
        student_answer: '10',
        student_reasoning: 'some reasoning',
      });

      assert.strictEqual(result.available, false);
      assert.strictEqual(result.analyzed, false);
      assert.strictEqual(result.has_misconception, false);
      assert.ok(result.message.includes('Connection timeout'));
    } finally {
      delete process.env.OPENAI_API_KEY;
    }
  });
});

after(async () => {
  try {
    await pool.end();
  } catch (e) {
    // Ignore pool teardown errors in tests
  }
});
