const { pool } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get all students (supports optional search query)
 */
async function getAllStudents(req, res, next) {
  try {
    const { search } = req.query;
    let query = 'SELECT student_id, name, email, created_at FROM students';
    const params = [];

    if (search) {
      query += ' WHERE name LIKE ? OR email LIKE ?';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY student_id ASC';
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
 * Get student by ID
 */
async function getStudentById(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT student_id, name, email, created_at FROM students WHERE student_id = ?',
      [id]
    );

    if (rows.length === 0) {
      throw new AppError(`Student with ID ${id} not found`, 404);
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
 * Create a new student
 */
async function createStudent(req, res, next) {
  try {
    const { name, email } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new AppError('Student name is required', 400);
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      throw new AppError('Student email is required', 400);
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    const [result] = await pool.execute(
      'INSERT INTO students (name, email) VALUES (?, ?)',
      [trimmedName, trimmedEmail]
    );

    const [newStudent] = await pool.execute(
      'SELECT student_id, name, email, created_at FROM students WHERE student_id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: newStudent[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing student
 */
async function updateStudent(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!name && !email) {
      throw new AppError('At least one of name or email must be provided to update', 400);
    }

    const [existing] = await pool.execute(
      'SELECT student_id, name, email FROM students WHERE student_id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw new AppError(`Student with ID ${id} not found`, 404);
    }

    const updatedName = name !== undefined ? name.trim() : existing[0].name;
    const updatedEmail = email !== undefined ? email.trim() : existing[0].email;

    if (!updatedName) {
      throw new AppError('Student name cannot be empty', 400);
    }
    if (!updatedEmail) {
      throw new AppError('Student email cannot be empty', 400);
    }

    await pool.execute(
      'UPDATE students SET name = ?, email = ? WHERE student_id = ?',
      [updatedName, updatedEmail, id]
    );

    const [updated] = await pool.execute(
      'SELECT student_id, name, email, created_at FROM students WHERE student_id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: updated[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a student
 */
async function deleteStudent(req, res, next) {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT student_id FROM students WHERE student_id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw new AppError(`Student with ID ${id} not found`, 404);
    }

    await pool.execute('DELETE FROM students WHERE student_id = ?', [id]);

    res.json({
      success: true,
      message: `Student with ID ${id} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all attempts made by a specific student
 */
async function getStudentAttempts(req, res, next) {
  try {
    const { id } = req.params;

    const [student] = await pool.execute('SELECT student_id, name FROM students WHERE student_id = ?', [id]);
    if (student.length === 0) {
      throw new AppError(`Student with ID ${id} not found`, 404);
    }

    const query = `
      SELECT 
        a.attempt_id,
        a.student_id,
        a.question_id,
        a.answer,
        a.reasoning,
        a.is_correct,
        a.hesitation_seconds,
        a.revision_count,
        a.timestamp,
        q.subject,
        q.topic,
        q.question_text,
        q.difficulty
      FROM attempts a
      JOIN questions q ON a.question_id = q.question_id
      WHERE a.student_id = ?
      ORDER BY a.timestamp DESC
    `;
    const [rows] = await pool.execute(query, [id]);

    res.json({
      success: true,
      student: student[0],
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all misconceptions diagnosed for a specific student's attempts
 */
async function getStudentMisconceptions(req, res, next) {
  try {
    const { id } = req.params;

    const [student] = await pool.execute('SELECT student_id, name FROM students WHERE student_id = ?', [id]);
    if (student.length === 0) {
      throw new AppError(`Student with ID ${id} not found`, 404);
    }

    const query = `
      SELECT 
        m.misconception_id,
        m.attempt_id,
        m.type,
        m.description,
        m.confidence,
        m.skill_area,
        a.question_id,
        a.timestamp AS attempt_timestamp,
        q.subject,
        q.topic,
        q.question_text
      FROM misconceptions m
      JOIN attempts a ON m.attempt_id = a.attempt_id
      JOIN questions q ON a.question_id = q.question_id
      WHERE a.student_id = ?
      ORDER BY m.misconception_id DESC
    `;
    const [rows] = await pool.execute(query, [id]);

    res.json({
      success: true,
      student: student[0],
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get aggregated analytics summary for a student
 */
async function getStudentSummary(req, res, next) {
  try {
    const { id } = req.params;

    const [student] = await pool.execute(
      'SELECT student_id, name, email, created_at FROM students WHERE student_id = ?',
      [id]
    );
    if (student.length === 0) {
      throw new AppError(`Student with ID ${id} not found`, 404);
    }

    const [attemptStats] = await pool.execute(`
      SELECT 
        COUNT(*) AS total_attempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct_attempts,
        AVG(hesitation_seconds) AS avg_hesitation_seconds,
        AVG(revision_count) AS avg_revisions
      FROM attempts
      WHERE student_id = ?
    `, [id]);

    const [subjectBreakdown] = await pool.execute(`
      SELECT 
        q.subject,
        COUNT(a.attempt_id) AS total_attempts,
        SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) AS correct_attempts
      FROM attempts a
      JOIN questions q ON a.question_id = q.question_id
      WHERE a.student_id = ?
      GROUP BY q.subject
    `, [id]);

    const [misconceptionCounts] = await pool.execute(`
      SELECT 
        m.type,
        m.skill_area,
        COUNT(m.misconception_id) AS count
      FROM misconceptions m
      JOIN attempts a ON m.attempt_id = a.attempt_id
      WHERE a.student_id = ?
      GROUP BY m.type, m.skill_area
      ORDER BY count DESC
      LIMIT 5
    `, [id]);

    const total = attemptStats[0].total_attempts || 0;
    const correct = attemptStats[0].correct_attempts || 0;
    const accuracyPercentage = total > 0 ? Number(((correct / total) * 100).toFixed(2)) : 0;

    res.json({
      success: true,
      data: {
        student: student[0],
        overview: {
          total_attempts: total,
          correct_attempts: correct,
          accuracy_percentage: accuracyPercentage,
          avg_hesitation_seconds: attemptStats[0].avg_hesitation_seconds ? Number(attemptStats[0].avg_hesitation_seconds.toFixed(2)) : null,
          avg_revisions: attemptStats[0].avg_revisions ? Number(attemptStats[0].avg_revisions.toFixed(2)) : 0,
        },
        subject_breakdown: subjectBreakdown,
        top_misconceptions: misconceptionCounts,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentAttempts,
  getStudentMisconceptions,
  getStudentSummary,
};
