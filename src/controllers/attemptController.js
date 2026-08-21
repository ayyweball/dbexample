const { pool } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { analyzeAttempt } = require('../services/aiService');

/**
 * Get all attempts with optional filters (student_id, question_id, is_correct)
 */
async function getAllAttempts(req, res, next) {
  try {
    const { student_id, question_id, is_correct, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        a.attempt_id,
        a.student_id,
        s.name AS student_name,
        s.email AS student_email,
        a.question_id,
        q.subject,
        q.topic,
        q.question_text,
        q.correct_answer,
        q.difficulty,
        a.answer,
        a.reasoning,
        a.is_correct,
        a.hesitation_seconds,
        a.revision_count,
        a.timestamp
      FROM attempts a
      JOIN students s ON a.student_id = s.student_id
      JOIN questions q ON a.question_id = q.question_id
      WHERE 1=1
    `;
    const params = [];

    if (student_id) {
      query += ' AND a.student_id = ?';
      params.push(student_id);
    }

    if (question_id) {
      query += ' AND a.question_id = ?';
      params.push(question_id);
    }

    if (is_correct !== undefined) {
      query += ' AND a.is_correct = ?';
      params.push(is_correct === 'true' || is_correct === '1' || is_correct === true ? 1 : 0);
    }

    query += ' ORDER BY a.timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.query(query, params);

    res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get attempt by ID (including student details, question details, misconceptions, and follow-up attempts)
 */
async function getAttemptById(req, res, next) {
  try {
    const { id } = req.params;

    const [attempts] = await pool.execute(`
      SELECT 
        a.attempt_id,
        a.student_id,
        s.name AS student_name,
        s.email AS student_email,
        a.question_id,
        q.subject,
        q.topic,
        q.question_text,
        q.correct_answer,
        q.difficulty,
        a.answer,
        a.reasoning,
        a.is_correct,
        a.hesitation_seconds,
        a.revision_count,
        a.timestamp
      FROM attempts a
      JOIN students s ON a.student_id = s.student_id
      JOIN questions q ON a.question_id = q.question_id
      WHERE a.attempt_id = ?
    `, [id]);

    if (attempts.length === 0) {
      throw new AppError(`Attempt with ID ${id} not found`, 404);
    }

    const attempt = attempts[0];

    // Fetch linked misconceptions
    const [misconceptions] = await pool.execute(
      'SELECT misconception_id, attempt_id, type, description, confidence, skill_area FROM misconceptions WHERE attempt_id = ? ORDER BY misconception_id ASC',
      [id]
    );

    // Fetch linked follow up attempts
    const [followUpAttempts] = await pool.execute(`
      SELECT 
        fa.followup_attempt_id,
        fa.followup_id,
        fq.question_text AS followup_question_text,
        fq.expected_concept,
        fa.attempt_id,
        fa.student_id,
        fa.answer,
        fa.reasoning,
        fa.is_correct,
        fa.timestamp
      FROM follow_up_attempts fa
      JOIN follow_up_questions fq ON fa.followup_id = fq.followup_id
      WHERE fa.attempt_id = ?
      ORDER BY fa.timestamp ASC
    `, [id]);

    res.json({
      success: true,
      data: {
        ...attempt,
        misconceptions,
        follow_up_attempts: followUpAttempts,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Submit / Create a new attempt and analyze for misconceptions using AI
 */
async function createAttempt(req, res, next) {
  try {
    const {
      student_id,
      question_id,
      answer,
      reasoning = null,
      is_correct,
      hesitation_seconds = null,
      revision_count = 0,
    } = req.body;

    if (!student_id) throw new AppError('student_id is required', 400);
    if (!question_id) throw new AppError('question_id is required', 400);
    if (answer === undefined || answer === null || String(answer).trim() === '') {
      throw new AppError('answer is required', 400);
    }

    // Validation for hesitation_seconds and revision_count check constraints
    const parsedHesitation = hesitation_seconds !== null && hesitation_seconds !== undefined
      ? parseFloat(hesitation_seconds)
      : null;
    const parsedRevisions = parseInt(revision_count || 0, 10);

    if (parsedHesitation !== null && (isNaN(parsedHesitation) || parsedHesitation < 0)) {
      throw new AppError('hesitation_seconds must be a non-negative number', 400);
    }
    if (isNaN(parsedRevisions) || parsedRevisions < 0) {
      throw new AppError('revision_count must be a non-negative integer', 400);
    }

    // Verify student exists
    const [student] = await pool.execute('SELECT student_id FROM students WHERE student_id = ?', [student_id]);
    if (student.length === 0) {
      throw new AppError(`Student with ID ${student_id} does not exist`, 404);
    }

    // Verify question exists
    const [question] = await pool.execute(
      'SELECT question_id, subject, topic, question_text, correct_answer, difficulty FROM questions WHERE question_id = ?',
      [question_id]
    );
    if (question.length === 0) {
      throw new AppError(`Question with ID ${question_id} does not exist`, 404);
    }

    // Auto calculate is_correct using database correct_answer if not explicitly provided
    let calculatedIsCorrect;
    if (is_correct !== undefined && is_correct !== null) {
      calculatedIsCorrect = Boolean(is_correct);
    } else {
      const studentAns = String(answer).trim().toLowerCase();
      const correctAns = String(question[0].correct_answer).trim().toLowerCase();
      calculatedIsCorrect = studentAns === correctAns;
    }

    // Step 1: Save the attempt to MySQL FIRST
    const [result] = await pool.execute(
      `INSERT INTO attempts 
        (student_id, question_id, answer, reasoning, is_correct, hesitation_seconds, revision_count) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        student_id,
        question_id,
        String(answer).trim(),
        reasoning ? String(reasoning).trim() : null,
        calculatedIsCorrect,
        parsedHesitation,
        parsedRevisions,
      ]
    );

    const attemptId = result.insertId;

    const [newAttempt] = await pool.execute(`
      SELECT 
        a.attempt_id,
        a.student_id,
        s.name AS student_name,
        a.question_id,
        q.subject,
        q.topic,
        q.question_text,
        q.correct_answer,
        q.difficulty,
        a.answer,
        a.reasoning,
        a.is_correct,
        a.hesitation_seconds,
        a.revision_count,
        a.timestamp
      FROM attempts a
      JOIN students s ON a.student_id = s.student_id
      JOIN questions q ON a.question_id = q.question_id
      WHERE a.attempt_id = ?
    `, [attemptId]);

    const savedAttempt = newAttempt[0];

    // Step 2: AI Misconception Analysis (Non-blocking & resilient)
    let aiAnalysisResult = {
      analyzed: false,
      has_misconception: false,
      misconception: null,
      follow_up: null,
    };

    try {
      const aiResponse = await analyzeAttempt({
        question_text: savedAttempt.question_text,
        subject: savedAttempt.subject,
        topic: savedAttempt.topic,
        difficulty: savedAttempt.difficulty,
        correct_answer: savedAttempt.correct_answer,
        student_answer: savedAttempt.answer,
        student_reasoning: savedAttempt.reasoning,
      });

      aiAnalysisResult = aiResponse;

      // If a misconception was diagnosed, save it into misconceptions table
      if (aiResponse.has_misconception && aiResponse.misconception) {
        console.log(`[AI Diagnostic] Inserting diagnosed misconception into database (attempt_id: ${attemptId})...`);
        const [miscResult] = await pool.execute(
          `INSERT INTO misconceptions (attempt_id, type, description, confidence, skill_area)
           VALUES (?, ?, ?, ?, ?)`,
          [
            attemptId,
            aiResponse.misconception.type,
            aiResponse.misconception.description,
            aiResponse.misconception.confidence,
            aiResponse.misconception.skill_area,
          ]
        );

        const misconceptionId = miscResult.insertId;
        aiAnalysisResult.misconception.misconception_id = misconceptionId;
        aiAnalysisResult.misconception.attempt_id = attemptId;
        console.log(`[AI Diagnostic] Misconception inserted with ID: ${misconceptionId}`);

        // If a follow-up remediation question was generated, save into follow_up_questions table
        if (aiResponse.follow_up && aiResponse.follow_up.question_text) {
          console.log(`[AI Diagnostic] Inserting follow-up remediation question into database (misconception_id: ${misconceptionId})...`);
          const [followupResult] = await pool.execute(
            `INSERT INTO follow_up_questions (misconception_id, question_text, expected_concept, difficulty)
             VALUES (?, ?, ?, ?)`,
            [
              misconceptionId,
              aiResponse.follow_up.question_text,
              aiResponse.follow_up.expected_concept,
              aiResponse.follow_up.difficulty,
            ]
          );

          aiAnalysisResult.follow_up.followup_id = followupResult.insertId;
          aiAnalysisResult.follow_up.misconception_id = misconceptionId;
          console.log(`[AI Diagnostic] Follow-up question inserted with ID: ${followupResult.insertId}`);
        }
      }
    } catch (aiError) {
      console.warn(`[AI Integration Warning] Non-blocking AI error during attempt ${attemptId}: ${aiError.message}`);
      aiAnalysisResult = {
        available: false,
        analyzed: false,
        message: `AI analysis unavailable: ${aiError.message}`,
        has_misconception: false,
        misconception: null,
        follow_up: null,
      };
    }

    res.status(201).json({
      success: true,
      message: 'Attempt recorded successfully',
      data: {
        ...savedAttempt,
        ai_analysis: aiAnalysisResult,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing attempt
 */
async function updateAttempt(req, res, next) {
  try {
    const { id } = req.params;
    const { answer, reasoning, is_correct, hesitation_seconds, revision_count } = req.body;

    const [existing] = await pool.execute(
      'SELECT attempt_id, answer, reasoning, is_correct, hesitation_seconds, revision_count FROM attempts WHERE attempt_id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw new AppError(`Attempt with ID ${id} not found`, 404);
    }

    const updatedAnswer = answer !== undefined ? String(answer).trim() : existing[0].answer;
    const updatedReasoning = reasoning !== undefined ? (reasoning ? String(reasoning).trim() : null) : existing[0].reasoning;
    const updatedIsCorrect = is_correct !== undefined ? Boolean(is_correct) : existing[0].is_correct;
    
    let updatedHesitation = existing[0].hesitation_seconds;
    if (hesitation_seconds !== undefined) {
      updatedHesitation = hesitation_seconds !== null ? parseFloat(hesitation_seconds) : null;
      if (updatedHesitation !== null && (isNaN(updatedHesitation) || updatedHesitation < 0)) {
        throw new AppError('hesitation_seconds must be a non-negative number', 400);
      }
    }

    let updatedRevisions = existing[0].revision_count;
    if (revision_count !== undefined) {
      updatedRevisions = parseInt(revision_count, 10);
      if (isNaN(updatedRevisions) || updatedRevisions < 0) {
        throw new AppError('revision_count must be a non-negative integer', 400);
      }
    }

    await pool.execute(
      `UPDATE attempts 
       SET answer = ?, reasoning = ?, is_correct = ?, hesitation_seconds = ?, revision_count = ? 
       WHERE attempt_id = ?`,
      [updatedAnswer, updatedReasoning, updatedIsCorrect, updatedHesitation, updatedRevisions, id]
    );

    const [updated] = await pool.execute('SELECT * FROM attempts WHERE attempt_id = ?', [id]);

    res.json({
      success: true,
      message: 'Attempt updated successfully',
      data: updated[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete an attempt
 */
async function deleteAttempt(req, res, next) {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT attempt_id FROM attempts WHERE attempt_id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw new AppError(`Attempt with ID ${id} not found`, 404);
    }

    await pool.execute('DELETE FROM attempts WHERE attempt_id = ?', [id]);

    res.json({
      success: true,
      message: `Attempt with ID ${id} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllAttempts,
  getAttemptById,
  createAttempt,
  updateAttempt,
  deleteAttempt,
};
