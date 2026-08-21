const express = require('express');
const {
  getAllAttempts,
  getAttemptById,
  createAttempt,
  updateAttempt,
  deleteAttempt,
} = require('../controllers/attemptController');

const router = express.Router();

router.get('/', getAllAttempts);
router.post('/', createAttempt);
router.get('/:id', getAttemptById);
router.put('/:id', updateAttempt);
router.delete('/:id', deleteAttempt);

module.exports = router;
