const express = require('express');
const router = express.Router();
// We'll implement the controller later
const questionController = require('../controllers/questionController');

// Get all questions
router.get('/', questionController.getAllQuestions);

// Get a specific question
router.get('/:id', questionController.getQuestionById);

// Create a new question
router.post('/', questionController.createQuestion);

// Update a question
router.put('/:id', questionController.updateQuestion);

// Delete a question
router.delete('/:id', questionController.deleteQuestion);

// Generate questions with AI
router.post('/generate', questionController.generateQuestionsWithAI);

// Extract questions from PDF/Image
router.post('/extract', questionController.extractQuestionsFromFile);

module.exports = router;
