const express = require('express');
const {
  getAllFollowupAttempts,
  getFollowupAttemptById,
  createFollowupAttempt,
  updateFollowupAttempt,
  deleteFollowupAttempt,
} = require('../controllers/followupAttemptController');

const router = express.Router();

router.get('/', getAllFollowupAttempts);
router.post('/', createFollowupAttempt);
router.get('/:id', getFollowupAttemptById);
router.put('/:id', updateFollowupAttempt);
router.delete('/:id', deleteFollowupAttempt);

module.exports = router;
