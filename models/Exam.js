const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  level: {
    type: String,
    enum: ['ortaokul', 'lise', 'üniversite'],
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  questions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    text: String,
    options: [String],
    correctAnswer: String,
    explanation: String,
    type: {
      type: String,
      enum: ['çoktan_seçmeli', 'boşluk_doldurma', 'açık_uçlu', 'doğru_yanlış'],
      required: true
    },
    points: {
      type: Number,
      default: 1
    }
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number, // Duration in minutes
    default: 40
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  submissions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: Date,
    answers: [{
      questionIndex: Number,
      answer: String,
      isCorrect: Boolean,
      points: Number
    }],
    totalScore: Number,
    duration: Number // Time taken in seconds
  }]
});

// Update the updatedAt field before saving
examSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Exam', examSchema);
