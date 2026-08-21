const { pool } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get all follow-up questions with optional filters
 */
async function getAllFollowupQuestions(req, res, next) {
  try {
    const { misconception_id, difficulty } = req.query;

    let query = `
      SELECT 
        fq.followup_id,
        fq.misconception_id,
        m.type AS misconception_type,
        m.skill_area,
        fq.question_text,
        fq.expected_concept,
        fq.difficulty
      FROM follow_up_questions fq
      JOIN misconceptions m ON fq.misconception_id = m.misconception_id
      WHERE 1=1
    `;
    const params = [];

    if (misconception_id) {
      query += ' AND fq.misconception_id = ?';
      params.push(misconception_id);
    }

    if (difficulty) {
      query += ' AND fq.difficulty = ?';
      params.push(difficulty);
    }

    query += ' ORDER BY fq.followup_id ASC';
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
 * Get follow-up question by ID
 */
async function getFollowupQuestionById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(`
      SELECT 
        fq.followup_id,
        fq.misconception_id,
        m.type AS misconception_type,
        m.description AS misconception_description,
        m.skill_area,
        fq.question_text,
        fq.expected_concept,
        fq.difficulty
      FROM follow_up_questions fq
      JOIN misconceptions m ON fq.misconception_id = m.misconception_id
      WHERE fq.followup_id = ?
    `, [id]);

    if (rows.length === 0) {
      throw new AppError(`Follow-up question with ID ${id} not found`, 404);
    }

    // Get any student attempts on this follow up question
    const [attempts] = await pool.execute(`
      SELECT 
        fa.followup_attempt_id,
        fa.student_id,
        s.name AS student_name,
        fa.answer,
        fa.reasoning,
        fa.is_correct,
        fa.timestamp
      FROM follow_up_attempts fa
      JOIN students s ON fa.student_id = s.student_id
      WHERE fa.followup_id = ?
      ORDER BY fa.timestamp DESC
    `, [id]);

    res.json({
      success: true,
      data: {
        ...rows[0],
        attempts,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new follow-up question
 */
async function createFollowupQuestion(req, res, next) {
  try {
    const { misconception_id, question_text, expected_concept = null, difficulty = null } = req.body;

    if (!misconception_id) throw new AppError('misconception_id is required', 400);
    if (!question_text || typeof question_text !== 'string' || !question_text.trim()) {
      throw new AppError('question_text is required', 400);
    }

    // Verify misconception exists
    const [misconception] = await pool.execute(
      'SELECT misconception_id FROM misconceptions WHERE misconception_id = ?',
      [misconception_id]
    );
    if (misconception.length === 0) {
      throw new AppError(`Misconception with ID ${misconception_id} does not exist`, 404);
    }

    const [result] = await pool.execute(
      `INSERT INTO follow_up_questions (misconception_id, question_text, expected_concept, difficulty)
       VALUES (?, ?, ?, ?)`,
      [
        misconception_id,
        question_text.trim(),
        expected_concept ? String(expected_concept).trim() : null,
        difficulty ? String(difficulty).trim() : null,
      ]
    );

    const [newQuestion] = await pool.execute(
      'SELECT followup_id, misconception_id, question_text, expected_concept, difficulty FROM follow_up_questions WHERE followup_id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Follow-up question created successfully',
      data: newQuestion[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing follow-up question
 */
async function updateFollowupQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const { question_text, expected_concept, difficulty } = req.body;

    const [existing] = await pool.execute(
      'SELECT followup_id, question_text, expected_concept, difficulty FROM follow_up_questions WHERE followup_id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw new AppError(`Follow-up question with ID ${id} not found`, 404);
    }

    const updatedText = question_text !== undefined ? String(question_text).trim() : existing[0].question_text;
    const updatedConcept = expected_concept !== undefined ? (expected_concept ? String(expected_concept).trim() : null) : existing[0].expected_concept;
    const updatedDiff = difficulty !== undefined ? (difficulty ? String(difficulty).trim() : null) : existing[0].difficulty;

    if (!updatedText) throw new AppError('question_text cannot be empty', 400);

    await pool.execute(
      `UPDATE follow_up_questions
       SET question_text = ?, expected_concept = ?, difficulty = ?
       WHERE followup_id = ?`,
      [updatedText, updatedConcept, updatedDiff, id]
    );

    const [updated] = await pool.execute(
      'SELECT followup_id, misconception_id, question_text, expected_concept, difficulty FROM follow_up_questions WHERE followup_id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Follow-up question updated successfully',
      data: updated[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a follow-up question
 */
async function deleteFollowupQuestion(req, res, next) {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT followup_id FROM follow_up_questions WHERE followup_id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw new AppError(`Follow-up question with ID ${id} not found`, 404);
    }

    await pool.execute('DELETE FROM follow_up_questions WHERE followup_id = ?', [id]);

    res.json({
      success: true,
      message: `Follow-up question with ID ${id} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllFollowupQuestions,
  getFollowupQuestionById,
  createFollowupQuestion,
  updateFollowupQuestion,
  deleteFollowupQuestion,
};
