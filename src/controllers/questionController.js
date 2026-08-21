const { pool } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

const ALLOWED_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

/**
 * Get all questions (supports filtering by subject, topic, difficulty, search)
 */
async function getAllQuestions(req, res, next) {
  try {
    const { subject, topic, difficulty, search } = req.query;
    let query = 'SELECT question_id, subject, topic, question_text, correct_answer, difficulty, created_at FROM questions WHERE 1=1';
    const params = [];

    if (subject) {
      query += ' AND subject = ?';
      params.push(subject);
    }

    if (topic) {
      query += ' AND topic = ?';
      params.push(topic);
    }

    if (difficulty) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }

    if (search) {
      query += ' AND (question_text LIKE ? OR topic LIKE ? OR subject LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY question_id ASC';
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
 * Get unique subjects and topics available in the question bank
 */
async function getSubjectsAndTopics(req, res, next) {
  try {
    const [rows] = await pool.execute(
      'SELECT DISTINCT subject, topic FROM questions ORDER BY subject ASC, topic ASC'
    );

    // Structure subjects with their topics array
    const subjectMap = {};
    rows.forEach(({ subject, topic }) => {
      if (!subjectMap[subject]) {
        subjectMap[subject] = [];
      }
      if (!subjectMap[subject].includes(topic)) {
        subjectMap[subject].push(topic);
      }
    });

    const structured = Object.keys(subjectMap).map((subject) => ({
      subject,
      topics: subjectMap[subject],
    }));

    res.json({
      success: true,
      data: structured,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single question by ID
 */
async function getQuestionById(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT question_id, subject, topic, question_text, correct_answer, difficulty, created_at FROM questions WHERE question_id = ?',
      [id]
    );

    if (rows.length === 0) {
      throw new AppError(`Question with ID ${id} not found`, 404);
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
 * Create a new question
 */
async function createQuestion(req, res, next) {
  try {
    const { subject, topic, question_text, correct_answer, difficulty } = req.body;

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      throw new AppError('Subject is required', 400);
    }
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      throw new AppError('Topic is required', 400);
    }
    if (!question_text || typeof question_text !== 'string' || !question_text.trim()) {
      throw new AppError('question_text is required', 400);
    }
    if (correct_answer === undefined || correct_answer === null || String(correct_answer).trim() === '') {
      throw new AppError('correct_answer is required', 400);
    }
    if (!difficulty || !ALLOWED_DIFFICULTIES.includes(difficulty)) {
      throw new AppError(`Difficulty must be one of: ${ALLOWED_DIFFICULTIES.join(', ')}`, 400);
    }

    const [result] = await pool.execute(
      'INSERT INTO questions (subject, topic, question_text, correct_answer, difficulty) VALUES (?, ?, ?, ?, ?)',
      [subject.trim(), topic.trim(), question_text.trim(), String(correct_answer).trim(), difficulty]
    );

    const [newQuestion] = await pool.execute(
      'SELECT question_id, subject, topic, question_text, correct_answer, difficulty, created_at FROM questions WHERE question_id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: newQuestion[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing question
 */
async function updateQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const { subject, topic, question_text, correct_answer, difficulty } = req.body;

    const [existing] = await pool.execute(
      'SELECT question_id, subject, topic, question_text, correct_answer, difficulty FROM questions WHERE question_id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw new AppError(`Question with ID ${id} not found`, 404);
    }

    const updatedSubject = subject !== undefined ? String(subject).trim() : existing[0].subject;
    const updatedTopic = topic !== undefined ? String(topic).trim() : existing[0].topic;
    const updatedQuestionText = question_text !== undefined ? String(question_text).trim() : existing[0].question_text;
    const updatedCorrectAnswer = correct_answer !== undefined ? String(correct_answer).trim() : existing[0].correct_answer;
    const updatedDifficulty = difficulty !== undefined ? difficulty : existing[0].difficulty;

    if (!updatedSubject) throw new AppError('Subject cannot be empty', 400);
    if (!updatedTopic) throw new AppError('Topic cannot be empty', 400);
    if (!updatedQuestionText) throw new AppError('question_text cannot be empty', 400);
    if (!updatedCorrectAnswer) throw new AppError('correct_answer cannot be empty', 400);
    if (!ALLOWED_DIFFICULTIES.includes(updatedDifficulty)) {
      throw new AppError(`Difficulty must be one of: ${ALLOWED_DIFFICULTIES.join(', ')}`, 400);
    }

    await pool.execute(
      'UPDATE questions SET subject = ?, topic = ?, question_text = ?, correct_answer = ?, difficulty = ? WHERE question_id = ?',
      [updatedSubject, updatedTopic, updatedQuestionText, updatedCorrectAnswer, updatedDifficulty, id]
    );

    const [updated] = await pool.execute(
      'SELECT question_id, subject, topic, question_text, correct_answer, difficulty, created_at FROM questions WHERE question_id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: updated[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a question
 */
async function deleteQuestion(req, res, next) {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT question_id FROM questions WHERE question_id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw new AppError(`Question with ID ${id} not found`, 404);
    }

    await pool.execute('DELETE FROM questions WHERE question_id = ?', [id]);

    res.json({
      success: true,
      message: `Question with ID ${id} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all attempts made on a specific question
 */
async function getQuestionAttempts(req, res, next) {
  try {
    const { id } = req.params;

    const [question] = await pool.execute('SELECT question_id, question_text, correct_answer FROM questions WHERE question_id = ?', [id]);
    if (question.length === 0) {
      throw new AppError(`Question with ID ${id} not found`, 404);
    }

    const query = `
      SELECT 
        a.attempt_id,
        a.student_id,
        s.name AS student_name,
        s.email AS student_email,
        a.answer,
        a.reasoning,
        a.is_correct,
        a.hesitation_seconds,
        a.revision_count,
        a.timestamp
      FROM attempts a
      JOIN students s ON a.student_id = s.student_id
      WHERE a.question_id = ?
      ORDER BY a.timestamp DESC
    `;
    const [rows] = await pool.execute(query, [id]);

    res.json({
      success: true,
      question: question[0],
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllQuestions,
  getSubjectsAndTopics,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionAttempts,
};
