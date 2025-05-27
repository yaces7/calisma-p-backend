// This controller will handle all question-related operations
const Question = require('../models/Question');
const OpenAI = require('openai');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

// Initialize OpenAI with API key (will be set from environment variables)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // This will be set in .env file
});

// Get all questions
exports.getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find({ userId: req.user.id });
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific question by ID
exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Soru bulunamadı' });
    }
    res.status(200).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new question
exports.createQuestion = async (req, res) => {
  try {
    const newQuestion = new Question({
      ...req.body,
      userId: req.user.id,
    });
    const savedQuestion = await newQuestion.save();
    res.status(201).json(savedQuestion);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a question
exports.updateQuestion = async (req, res) => {
  try {
    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedQuestion) {
      return res.status(404).json({ message: 'Soru bulunamadı' });
    }
    res.status(200).json(updatedQuestion);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a question
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Soru bulunamadı' });
    }
    
    // Check if user owns this question
    if (question.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }
    
    await Question.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Soru başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate questions with AI
exports.generateQuestionsWithAI = async (req, res) => {
  try {
    const { level, subject, count, type } = req.body;
    
    if (!level || !subject || !count || !type) {
      return res.status(400).json({ message: 'Seviye, konu, sayı ve soru tipi gereklidir' });
    }
    
    // Construct the prompt for OpenAI
    const prompt = `
      ${level} seviyesinde ${subject} konusu için ${count} adet ${type} tipi soru oluştur.
      
      Her soru için şu formatı kullan:
      {
        "question": "Soru metni",
        "options": ["A) Seçenek", "B) Seçenek", ...] (çoktan seçmeli sorular için),
        "correctAnswer": "Doğru cevap",
        "explanation": "Açıklama"
      }
      
      Tüm soruları bir JSON dizisi olarak döndür.
    `;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Sen bir eğitim uzmanısın ve kaliteli sınav soruları oluşturuyorsun." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });
    
    // Parse the response
    let questions = [];
    try {
      const content = response.choices[0].message.content;
      // Extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('AI yanıtı JSON formatında değil');
      }
    } catch (parseError) {
      return res.status(500).json({ message: 'AI yanıtı işlenemedi', error: parseError.message });
    }
    
    // Save the questions to the database
    const savedQuestions = [];
    for (const q of questions) {
      const newQuestion = new Question({
        text: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        type,
        level,
        subject,
        userId: req.user.id,
      });
      
      const savedQuestion = await newQuestion.save();
      savedQuestions.push(savedQuestion);
    }
    
    res.status(201).json(savedQuestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Configure storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim ve PDF dosyaları yüklenebilir'), false);
    }
  }
}).single('file');

// Extract questions from PDF/Image
exports.extractQuestionsFromFile = async (req, res) => {
  // Handle file upload
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'Dosya yüklenmedi' });
    }
    
    try {
      const filePath = req.file.path;
      
      // Use Tesseract.js for OCR
      const { data } = await Tesseract.recognize(filePath, 'tur');
      const extractedText = data.text;
      
      // Use OpenAI to analyze the extracted text and identify questions
      const prompt = `
        Aşağıdaki metinden sınav sorularını ve cevaplarını ayıkla:
        
        ${extractedText}
        
        Her soru için şu formatı kullan:
        {
          "question": "Soru metni",
          "options": ["A) Seçenek", "B) Seçenek", ...] (çoktan seçmeli sorular için),
          "correctAnswer": "Doğru cevap"
        }
        
        Tüm soruları bir JSON dizisi olarak döndür.
      `;
      
      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "Sen bir eğitim uzmanısın ve metinlerden sınav sorularını ve cevaplarını ayıklıyorsun." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
      });
      
      // Parse the response
      let questions = [];
      try {
        const content = response.choices[0].message.content;
        // Extract JSON from the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          questions = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('AI yanıtı JSON formatında değil');
        }
      } catch (parseError) {
        return res.status(500).json({ message: 'AI yanıtı işlenemedi', error: parseError.message });
      }
      
      // Clean up the uploaded file
      fs.unlinkSync(filePath);
      
      res.status(200).json({
        message: 'Sorular başarıyla ayıklandı',
        questions,
        extractedText
      });
    } catch (error) {
      // Clean up the uploaded file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ message: error.message });
    }
  });
};
