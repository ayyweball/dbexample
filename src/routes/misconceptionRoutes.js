const express = require('express');
const {
  getAllMisconceptions,
  getMisconceptionById,
  createMisconception,
  updateMisconception,
  deleteMisconception,
} = require('../controllers/misconceptionController');

const router = express.Router();

router.get('/', getAllMisconceptions);
router.post('/', createMisconception);
router.get('/:id', getMisconceptionById);
router.put('/:id', updateMisconception);
router.delete('/:id', deleteMisconception);

module.exports = router;
