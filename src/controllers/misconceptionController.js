const { pool } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get all misconceptions with optional filters
 */
async function getAllMisconceptions(req, res, next) {
  try {
    const { attempt_id, student_id, type, skill_area } = req.query;

    let query = `
      SELECT 
        m.misconception_id,
        m.attempt_id,
        a.student_id,
        s.name AS student_name,
        a.question_id,
        q.subject,
        q.topic,
        q.question_text,
        m.type,
        m.description,
        m.confidence,
        m.skill_area
      FROM misconceptions m
      JOIN attempts a ON m.attempt_id = a.attempt_id
      JOIN students s ON a.student_id = s.student_id
      JOIN questions q ON a.question_id = q.question_id
      WHERE 1=1
    `;
    const params = [];

    if (attempt_id) {
      query += ' AND m.attempt_id = ?';
      params.push(attempt_id);
    }

    if (student_id) {
      query += ' AND a.student_id = ?';
      params.push(student_id);
    }

    if (type) {
      query += ' AND m.type = ?';
      params.push(type);
    }

    if (skill_area) {
      query += ' AND m.skill_area = ?';
      params.push(skill_area);
    }

    query += ' ORDER BY m.misconception_id DESC';
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
 * Get misconception by ID (with question context & follow-up questions)
 */
async function getMisconceptionById(req, res, next) {
  try {
    const { id } = req.params;

    const [misconceptions] = await pool.execute(`
      SELECT 
        m.misconception_id,
        m.attempt_id,
        a.student_id,
        s.name AS student_name,
        a.question_id,
        q.subject,
        q.topic,
        q.question_text,
        a.answer AS student_answer,
        a.reasoning AS student_reasoning,
        m.type,
        m.description,
        m.confidence,
        m.skill_area
      FROM misconceptions m
      JOIN attempts a ON m.attempt_id = a.attempt_id
      JOIN students s ON a.student_id = s.student_id
      JOIN questions q ON a.question_id = q.question_id
      WHERE m.misconception_id = ?
    `, [id]);

    if (misconceptions.length === 0) {
      throw new AppError(`Misconception with ID ${id} not found`, 404);
    }

    const misconception = misconceptions[0];

    // Fetch follow up questions for this misconception
    const [followUpQuestions] = await pool.execute(
      'SELECT followup_id, misconception_id, question_text, expected_concept, difficulty FROM follow_up_questions WHERE misconception_id = ?',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...misconception,
        follow_up_questions: followUpQuestions,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Record a diagnosed misconception
 */
async function createMisconception(req, res, next) {
  try {
    const { attempt_id, type, description = null, confidence = null, skill_area = null } = req.body;

    if (!attempt_id) throw new AppError('attempt_id is required', 400);
    if (!type || typeof type !== 'string' || !type.trim()) {
      throw new AppError('Misconception type is required', 400);
    }

    let parsedConfidence = null;
    if (confidence !== null && confidence !== undefined) {
      parsedConfidence = parseFloat(confidence);
      if (isNaN(parsedConfidence) || parsedConfidence < 0.00 || parsedConfidence > 1.00) {
        throw new AppError('confidence must be a number between 0.00 and 1.00', 400);
      }
    }

    // Verify attempt exists
    const [attempt] = await pool.execute('SELECT attempt_id FROM attempts WHERE attempt_id = ?', [attempt_id]);
    if (attempt.length === 0) {
      throw new AppError(`Attempt with ID ${attempt_id} does not exist`, 404);
    }

    const [result] = await pool.execute(
      `INSERT INTO misconceptions (attempt_id, type, description, confidence, skill_area)
       VALUES (?, ?, ?, ?, ?)`,
      [
        attempt_id,
        type.trim(),
        description ? String(description).trim() : null,
        parsedConfidence,
        skill_area ? String(skill_area).trim() : null,
      ]
    );

    const [newRecord] = await pool.execute(
      'SELECT misconception_id, attempt_id, type, description, confidence, skill_area FROM misconceptions WHERE misconception_id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Misconception recorded successfully',
      data: newRecord[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing misconception
 */
async function updateMisconception(req, res, next) {
  try {
    const { id } = req.params;
    const { type, description, confidence, skill_area } = req.body;

    const [existing] = await pool.execute(
      'SELECT misconception_id, type, description, confidence, skill_area FROM misconceptions WHERE misconception_id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw new AppError(`Misconception with ID ${id} not found`, 404);
    }

    const updatedType = type !== undefined ? String(type).trim() : existing[0].type;
    const updatedDesc = description !== undefined ? (description ? String(description).trim() : null) : existing[0].description;
    const updatedSkill = skill_area !== undefined ? (skill_area ? String(skill_area).trim() : null) : existing[0].skill_area;

    if (!updatedType) throw new AppError('Misconception type cannot be empty', 400);

    let updatedConfidence = existing[0].confidence;
    if (confidence !== undefined) {
      if (confidence === null) {
        updatedConfidence = null;
      } else {
        updatedConfidence = parseFloat(confidence);
        if (isNaN(updatedConfidence) || updatedConfidence < 0.00 || updatedConfidence > 1.00) {
          throw new AppError('confidence must be a number between 0.00 and 1.00', 400);
        }
      }
    }

    await pool.execute(
      `UPDATE misconceptions
       SET type = ?, description = ?, confidence = ?, skill_area = ?
       WHERE misconception_id = ?`,
      [updatedType, updatedDesc, updatedConfidence, updatedSkill, id]
    );

    const [updated] = await pool.execute(
      'SELECT misconception_id, attempt_id, type, description, confidence, skill_area FROM misconceptions WHERE misconception_id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Misconception updated successfully',
      data: updated[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a misconception
 */
async function deleteMisconception(req, res, next) {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT misconception_id FROM misconceptions WHERE misconception_id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw new AppError(`Misconception with ID ${id} not found`, 404);
    }

    await pool.execute('DELETE FROM misconceptions WHERE misconception_id = ?', [id]);

    res.json({
      success: true,
      message: `Misconception with ID ${id} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllMisconceptions,
  getMisconceptionById,
  createMisconception,
  updateMisconception,
  deleteMisconception,
};
