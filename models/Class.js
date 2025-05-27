const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  level: {
    type: String,
    enum: ['ortaokul', 'lise', 'üniversite'],
    required: true
  },
  subject: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  assignedExams: [{
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    dueDate: Date
  }],
  code: {
    type: String,
    unique: true
  }
});

// Generate a unique class code before saving
classSchema.pre('save', function(next) {
  if (!this.code) {
    // Generate a random 6-character alphanumeric code
    this.code = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Class', classSchema);
