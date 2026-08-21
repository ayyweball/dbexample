const Groq = require('groq-sdk');

const ALLOWED_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

let customClient = null;

/**
 * For testing purposes: inject a mock Groq client
 */
function setGroqClient(client) {
  customClient = client;
}

/**
 * Validates and sanitizes AI response data against MySQL schema constraints
 */
function sanitizeAiResponse(parsedData, defaultDifficulty = 'Easy') {
  if (!parsedData || typeof parsedData !== 'object') {
    return { has_misconception: false, misconception: null, follow_up: null };
  }

  const hasMisconception = Boolean(parsedData.has_misconception);

  if (!hasMisconception || !parsedData.misconception) {
    return {
      has_misconception: false,
      misconception: null,
      follow_up: null,
    };
  }

  // Sanitize Misconception fields
  const rawMisc = parsedData.misconception;
  let confidence = parseFloat(rawMisc.confidence);
  if (isNaN(confidence) || confidence < 0.00) {
    confidence = 0.85;
  } else if (confidence > 1.00) {
    confidence = 1.00;
  }
  confidence = Number(confidence.toFixed(2));

  const misconception = {
    type: String(rawMisc.type || 'Conceptual Misconception').trim().substring(0, 100),
    description: rawMisc.description ? String(rawMisc.description).trim() : null,
    confidence,
    skill_area: rawMisc.skill_area ? String(rawMisc.skill_area).trim().substring(0, 100) : null,
  };

  // Sanitize Follow-up Question fields
  let followUp = null;
  if (parsedData.follow_up && parsedData.follow_up.question_text) {
    const rawFollowUp = parsedData.follow_up;
    let difficulty = rawFollowUp.difficulty ? String(rawFollowUp.difficulty).trim() : defaultDifficulty;
    if (!ALLOWED_DIFFICULTIES.includes(difficulty)) {
      difficulty = ALLOWED_DIFFICULTIES.includes(defaultDifficulty) ? defaultDifficulty : 'Easy';
    }

    followUp = {
      question_text: String(rawFollowUp.question_text).trim(),
      expected_concept: rawFollowUp.expected_concept
        ? String(rawFollowUp.expected_concept).trim().substring(0, 150)
        : null,
      difficulty,
    };
  }

  return {
    has_misconception: true,
    misconception,
    follow_up: followUp,
  };
}

/**
 * Analyze a student's answer and reasoning using Groq API
 * 
 * @param {Object} params
 * @param {string} params.question_text - Original question text
 * @param {string} params.subject - Question subject (e.g. Mathematics)
 * @param {string} params.topic - Question topic (e.g. Linear Equations)
 * @param {string} params.difficulty - Question difficulty (Easy, Medium, Hard)
 * @param {string} params.correct_answer - Authoritative correct answer from MySQL
 * @param {string} params.student_answer - Answer submitted by the student
 * @param {string|null} params.student_reasoning - Reasoning submitted by the student
 * @returns {Promise<Object>} Analyzed result with has_misconception, misconception, and follow_up
 */
async function analyzeAttempt({
  question_text,
  subject,
  topic,
  difficulty = 'Easy',
  correct_answer,
  student_answer,
  student_reasoning,
}) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    console.log('[AI Diagnostic] AI analysis started: GROQ_API_KEY is not configured in process.env. Skipping Groq API call.');
    return {
      available: false,
      analyzed: false,
      message: 'AI analysis unavailable: GROQ_API_KEY is not configured in .env',
      has_misconception: false,
      misconception: null,
      follow_up: null,
    };
  }

  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

  console.log(`[AI Diagnostic] AI analysis started. Calling Groq (model: "${model}")...`);

  try {
    const groq = customClient || new Groq({ apiKey: apiKey.trim() });

    const systemPrompt = `You are an expert diagnostic tutor and educational psychologist.
Analyze the student's answer and reasoning to detect conceptual errors, procedural flaws, or underlying misconceptions.
The correct answer from the database is authoritative: "${correct_answer}".

Respond ONLY with a valid JSON object strictly matching this schema:
{
  "has_misconception": boolean,
  "misconception": {
    "type": "string (brief name of misconception, max 100 chars)",
    "description": "string (clear diagnostic explanation of what the student misunderstood)",
    "confidence": number between 0.00 and 1.00,
    "skill_area": "string (sub-skill area, max 100 chars)"
  } or null,
  "follow_up": {
    "question_text": "string (targeted question to remediate and test this specific concept)",
    "expected_concept": "string (key concept being tested, max 150 chars)",
    "difficulty": "Easy" | "Medium" | "Hard"
  } or null
}

Rules:
1. If the student made a genuine conceptual or procedural mistake in their reasoning or answer, set "has_misconception": true, provide "misconception" details, and create a targeted "follow_up" remediation question.
2. If the student is correct or only made an obvious trivial typo without a conceptual misunderstanding, set "has_misconception": false, "misconception": null, and "follow_up": null.
3. Keep the follow_up question clear, focused, and directly addressing the identified misconception.`;

    const userPrompt = `Subject: ${subject}
Topic: ${topic}
Question Difficulty: ${difficulty}
Question: ${question_text}
Authoritative Correct Answer: ${correct_answer}

Student Answer: ${student_answer}
Student Reasoning: ${student_reasoning || 'No reasoning provided.'}`;

    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 600,
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error('Empty response from Groq API');
    }

    console.log('[AI Diagnostic] Groq response received successfully.');
    const parsed = JSON.parse(rawContent);
    const sanitized = sanitizeAiResponse(parsed, difficulty);
    console.log('[AI Diagnostic] AI analysis result - has_misconception:', sanitized.has_misconception, sanitized.misconception ? `(type: "${sanitized.misconception.type}", confidence: ${sanitized.misconception.confidence})` : '');

    return {
      available: true,
      analyzed: true,
      model,
      ...sanitized,
    };
  } catch (error) {
    // Log error safely without exposing API keys
    console.warn(`[AI Service Warning] Misconception analysis failed: ${error.message}`);

    return {
      available: false,
      analyzed: false,
      message: `AI analysis unavailable: ${error.message}`,
      has_misconception: false,
      misconception: null,
      follow_up: null,
    };
  }
}

module.exports = {
  analyzeAttempt,
  sanitizeAiResponse,
  setGroqClient,
  setOpenAiClient: setGroqClient, // backwards compatibility alias
};
