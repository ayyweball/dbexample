const express = require('express');
const {
  getAllQuestions,
  getSubjectsAndTopics,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionAttempts,
} = require('../controllers/questionController');

const router = express.Router();

router.get('/', getAllQuestions);
router.get('/meta/subjects', getSubjectsAndTopics);
router.post('/', createQuestion);
router.get('/:id', getQuestionById);
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);
router.get('/:id/attempts', getQuestionAttempts);

module.exports = router;
