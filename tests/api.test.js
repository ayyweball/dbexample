const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

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
