const express = require('express');
const {
  getAllFollowupQuestions,
  getFollowupQuestionById,
  createFollowupQuestion,
  updateFollowupQuestion,
  deleteFollowupQuestion,
} = require('../controllers/followupQuestionController');

const router = express.Router();

router.get('/', getAllFollowupQuestions);
router.post('/', createFollowupQuestion);
router.get('/:id', getFollowupQuestionById);
router.put('/:id', updateFollowupQuestion);
router.delete('/:id', deleteFollowupQuestion);

module.exports = router;
