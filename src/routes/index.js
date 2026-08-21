const express = require('express');
const healthRoutes = require('./healthRoutes');
const studentRoutes = require('./studentRoutes');
const questionRoutes = require('./questionRoutes');
const attemptRoutes = require('./attemptRoutes');
const misconceptionRoutes = require('./misconceptionRoutes');
const followupQuestionRoutes = require('./followupQuestionRoutes');
const followupAttemptRoutes = require('./followupAttemptRoutes');
const statsRoutes = require('./statsRoutes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/students', studentRoutes);
router.use('/questions', questionRoutes);
router.use('/attempts', attemptRoutes);
router.use('/misconceptions', misconceptionRoutes);
router.use('/followup-questions', followupQuestionRoutes);
router.use('/followup-attempts', followupAttemptRoutes);
router.use('/stats', statsRoutes);

module.exports = router;
