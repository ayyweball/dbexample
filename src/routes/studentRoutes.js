const express = require('express');
const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentAttempts,
  getStudentMisconceptions,
  getStudentSummary,
} = require('../controllers/studentController');

const router = express.Router();

router.get('/', getAllStudents);
router.post('/', createStudent);
router.get('/:id', getStudentById);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

// Student relationships & analytics
router.get('/:id/attempts', getStudentAttempts);
router.get('/:id/misconceptions', getStudentMisconceptions);
router.get('/:id/summary', getStudentSummary);

module.exports = router;
