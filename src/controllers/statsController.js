const { pool } = require('../config/db');

/**
 * Get platform-wide overview statistics
 */
async function getOverviewStats(req, res, next) {
  try {
    const [[studentsCount]] = await pool.execute('SELECT COUNT(*) AS total_students FROM students');
    const [[questionsCount]] = await pool.execute('SELECT COUNT(*) AS total_questions FROM questions');
    const [[attemptsCount]] = await pool.execute(`
      SELECT 
        COUNT(*) AS total_attempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct_attempts,
        AVG(hesitation_seconds) AS avg_hesitation_seconds,
        AVG(revision_count) AS avg_revisions
      FROM attempts
    `);
    const [[misconceptionsCount]] = await pool.execute('SELECT COUNT(*) AS total_misconceptions FROM misconceptions');
    const [[followupCount]] = await pool.execute('SELECT COUNT(*) AS total_followup_questions FROM follow_up_questions');
    const [[followupAttemptsCount]] = await pool.execute(`
      SELECT 
        COUNT(*) AS total_followup_attempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct_followup_attempts
      FROM follow_up_attempts
    `);

    const [subjectCounts] = await pool.execute(`
      SELECT subject, COUNT(*) AS count
      FROM questions
      GROUP BY subject
      ORDER BY count DESC
    `);

    const [topMisconceptions] = await pool.execute(`
      SELECT type, skill_area, COUNT(*) AS count, AVG(confidence) AS avg_confidence
      FROM misconceptions
      GROUP BY type, skill_area
      ORDER BY count DESC
      LIMIT 10
    `);

    const total = attemptsCount.total_attempts || 0;
    const correct = attemptsCount.correct_attempts || 0;
    const accuracy = total > 0 ? Number(((correct / total) * 100).toFixed(2)) : 0;

    const totalFollowups = followupAttemptsCount.total_followup_attempts || 0;
    const correctFollowups = followupAttemptsCount.correct_followup_attempts || 0;
    const followupAccuracy = totalFollowups > 0 ? Number(((correctFollowups / totalFollowups) * 100).toFixed(2)) : 0;

    res.json({
      success: true,
      data: {
        totals: {
          students: studentsCount.total_students,
          questions: questionsCount.total_questions,
          attempts: total,
          correct_attempts: correct,
          accuracy_percentage: accuracy,
          avg_hesitation_seconds: attemptsCount.avg_hesitation_seconds ? Number(attemptsCount.avg_hesitation_seconds.toFixed(2)) : null,
          avg_revisions: attemptsCount.avg_revisions ? Number(attemptsCount.avg_revisions.toFixed(2)) : 0,
          misconceptions: misconceptionsCount.total_misconceptions,
          followup_questions: followupCount.total_followup_questions,
          followup_attempts: totalFollowups,
          followup_accuracy_percentage: followupAccuracy,
        },
        questions_by_subject: subjectCounts,
        top_misconceptions: topMisconceptions.map(item => ({
          ...item,
          avg_confidence: item.avg_confidence ? Number(item.avg_confidence.toFixed(2)) : null,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOverviewStats,
};
