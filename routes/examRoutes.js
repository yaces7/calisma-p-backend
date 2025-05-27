const express = require('express');
const router = express.Router();
// We'll implement the controller later
const examController = require('../controllers/examController');

// Get all exams
router.get('/', examController.getAllExams);

// Get a specific exam
router.get('/:id', examController.getExamById);

// Create a new exam
router.post('/', examController.createExam);

// Update an exam
router.put('/:id', examController.updateExam);

// Delete an exam
router.delete('/:id', examController.deleteExam);

// Generate exam with AI
router.post('/generate', examController.generateExamWithAI);

// Export PDF
router.get('/:id/export', examController.exportExamToPDF);

module.exports = router;
