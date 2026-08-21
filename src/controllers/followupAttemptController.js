const { pool } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get all follow-up attempts with optional filters
 */
async function getAllFollowupAttempts(req, res, next) {
  try {
    const { student_id, followup_id, attempt_id, is_correct } = req.query;

    let query = `
      SELECT 
        fa.followup_attempt_id,
        fa.followup_id,
        fq.question_text AS followup_question_text,
        fq.expected_concept,
        fa.attempt_id,
        fa.student_id,
        s.name AS student_name,
        s.email AS student_email,
        fa.answer,
        fa.reasoning,
        fa.is_correct,
        fa.timestamp
      FROM follow_up_attempts fa
      JOIN follow_up_questions fq ON fa.followup_id = fq.followup_id
      JOIN students s ON fa.student_id = s.student_id
      WHERE 1=1
    `;
    const params = [];

    if (student_id) {
      query += ' AND fa.student_id = ?';
      params.push(student_id);
    }

    if (followup_id) {
      query += ' AND fa.followup_id = ?';
      params.push(followup_id);
    }

    if (attempt_id) {
      query += ' AND fa.attempt_id = ?';
      params.push(attempt_id);
    }

    if (is_correct !== undefined) {
      query += ' AND fa.is_correct = ?';
      params.push(is_correct === 'true' || is_correct === '1' || is_correct === true ? 1 : 0);
    }

    query += ' ORDER BY fa.timestamp DESC';
    const [rows] = await pool.execute(query, params);

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
 * Get single follow-up attempt by ID
 */
async function getFollowupAttemptById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(`
      SELECT 
        fa.followup_attempt_id,
        fa.followup_id,
        fq.question_text AS followup_question_text,
        fq.expected_concept,
        fq.difficulty,
        fa.attempt_id,
        fa.student_id,
        s.name AS student_name,
        s.email AS student_email,
        fa.answer,
        fa.reasoning,
        fa.is_correct,
        fa.timestamp
      FROM follow_up_attempts fa
      JOIN follow_up_questions fq ON fa.followup_id = fq.followup_id
      JOIN students s ON fa.student_id = s.student_id
      WHERE fa.followup_attempt_id = ?
    `, [id]);

    if (rows.length === 0) {
      throw new AppError(`Follow-up attempt with ID ${id} not found`, 404);
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a follow-up attempt
 */
async function createFollowupAttempt(req, res, next) {
  try {
    const { followup_id, attempt_id, student_id, answer, reasoning = null, is_correct = null } = req.body;

    if (!followup_id) throw new AppError('followup_id is required', 400);
    if (!attempt_id) throw new AppError('attempt_id is required', 400);
    if (!student_id) throw new AppError('student_id is required', 400);
    if (answer === undefined || answer === null || String(answer).trim() === '') {
      throw new AppError('answer is required', 400);
    }

    // Verify foreign keys exist
    const [followup] = await pool.execute('SELECT followup_id FROM follow_up_questions WHERE followup_id = ?', [followup_id]);
    if (followup.length === 0) {
      throw new AppError(`Follow-up question with ID ${followup_id} does not exist`, 404);
    }

    const [attempt] = await pool.execute('SELECT attempt_id FROM attempts WHERE attempt_id = ?', [attempt_id]);
    if (attempt.length === 0) {
      throw new AppError(`Attempt with ID ${attempt_id} does not exist`, 404);
    }

    const [student] = await pool.execute('SELECT student_id FROM students WHERE student_id = ?', [student_id]);
    if (student.length === 0) {
      throw new AppError(`Student with ID ${student_id} does not exist`, 404);
    }

    const calculatedCorrect = is_correct !== null && is_correct !== undefined ? Boolean(is_correct) : null;

    const [result] = await pool.execute(
      `INSERT INTO follow_up_attempts (followup_id, attempt_id, student_id, answer, reasoning, is_correct)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        followup_id,
        attempt_id,
        student_id,
        String(answer).trim(),
        reasoning ? String(reasoning).trim() : null,
        calculatedCorrect,
      ]
    );

    const [newAttempt] = await pool.execute(
      'SELECT * FROM follow_up_attempts WHERE followup_attempt_id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Follow-up attempt submitted successfully',
      data: newAttempt[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing follow-up attempt
 */
async function updateFollowupAttempt(req, res, next) {
  try {
    const { id } = req.params;
    const { answer, reasoning, is_correct } = req.body;

    const [existing] = await pool.execute(
      'SELECT followup_attempt_id, answer, reasoning, is_correct FROM follow_up_attempts WHERE followup_attempt_id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw new AppError(`Follow-up attempt with ID ${id} not found`, 404);
    }

    const updatedAnswer = answer !== undefined ? String(answer).trim() : existing[0].answer;
    const updatedReasoning = reasoning !== undefined ? (reasoning ? String(reasoning).trim() : null) : existing[0].reasoning;
    const updatedIsCorrect = is_correct !== undefined ? (is_correct !== null ? Boolean(is_correct) : null) : existing[0].is_correct;

    if (!updatedAnswer) throw new AppError('answer cannot be empty', 400);

    await pool.execute(
      `UPDATE follow_up_attempts
       SET answer = ?, reasoning = ?, is_correct = ?
       WHERE followup_attempt_id = ?`,
      [updatedAnswer, updatedReasoning, updatedIsCorrect, id]
    );

    const [updated] = await pool.execute(
      'SELECT * FROM follow_up_attempts WHERE followup_attempt_id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Follow-up attempt updated successfully',
      data: updated[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a follow-up attempt
 */
async function deleteFollowupAttempt(req, res, next) {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT followup_attempt_id FROM follow_up_attempts WHERE followup_attempt_id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw new AppError(`Follow-up attempt with ID ${id} not found`, 404);
    }

    await pool.execute('DELETE FROM follow_up_attempts WHERE followup_attempt_id = ?', [id]);

    res.json({
      success: true,
      message: `Follow-up attempt with ID ${id} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllFollowupAttempts,
  getFollowupAttemptById,
  createFollowupAttempt,
  updateFollowupAttempt,
  deleteFollowupAttempt,
};
