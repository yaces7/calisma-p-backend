// This controller will handle all exam-related operations
const Exam = require('../models/Exam');
const OpenAI = require('openai');

// Initialize OpenAI with API key (will be set from environment variables)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // This will be set in .env file
});

// Get all exams
exports.getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find({ userId: req.user.id });
    res.status(200).json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific exam by ID
exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Sınav bulunamadı' });
    }
    res.status(200).json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new exam
exports.createExam = async (req, res) => {
  try {
    const newExam = new Exam({
      ...req.body,
      userId: req.user.id,
    });
    const savedExam = await newExam.save();
    res.status(201).json(savedExam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update an exam
exports.updateExam = async (req, res) => {
  try {
    const updatedExam = await Exam.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedExam) {
      return res.status(404).json({ message: 'Sınav bulunamadı' });
    }
    res.status(200).json(updatedExam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an exam
exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Sınav bulunamadı' });
    }
    
    // Check if user owns this exam
    if (exam.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }
    
    await exam.remove();
    res.status(200).json({ message: 'Sınav başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate exam with AI
exports.generateExamWithAI = async (req, res) => {
  try {
    const { level, subject, questionCount, questionTypes } = req.body;
    
    if (!level || !subject || !questionCount) {
      return res.status(400).json({ message: 'Seviye, konu ve soru sayısı gereklidir' });
    }
    
    // Construct the prompt for OpenAI
    const prompt = `
      Bir ${level} seviyesinde ${subject} konusu için ${questionCount} adet soru oluştur.
      Soru tipleri: ${questionTypes.join(', ')}
      
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
    
    // Create a new exam with the generated questions
    const newExam = new Exam({
      title: `${subject} - ${level}`,
      description: `${level} seviyesinde ${subject} konusu için otomatik oluşturulmuş sınav`,
      level,
      subject,
      questions,
      userId: req.user.id,
      createdAt: new Date(),
    });
    
    const savedExam = await newExam.save();
    res.status(201).json(savedExam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export exam to PDF
exports.exportExamToPDF = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Sınav bulunamadı' });
    }
    
    // PDF oluşturmak için PDFKit kullanacağız
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });
    
    // Content-Type header'ı ayarla
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${exam.title.replace(/\s+/g, '_')}.pdf`);
    
    // PDF'i doğrudan response'a gönder
    doc.pipe(res);
    
    // PDF başlığı ve bilgileri
    doc.fontSize(25).text(exam.title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Seviye: ${exam.level}`, { align: 'center' });
    doc.fontSize(14).text(`Konu: ${exam.subject}`, { align: 'center' });
    doc.fontSize(14).text(`Süre: ${exam.duration} dakika`, { align: 'center' });
    doc.moveDown();
    
    if (exam.description) {
      doc.fontSize(12).text(exam.description, { align: 'center' });
      doc.moveDown();
    }
    
    // Çizgi çiz
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
    doc.moveDown();
    
    // Soruları ekle
    exam.questions.forEach((question, index) => {
      doc.fontSize(14).text(`Soru ${index + 1}: ${question.text}`);
      doc.moveDown(0.5);
      
      // Seçenekleri ekle (eğer varsa)
      if (question.options && question.options.length > 0) {
        question.options.forEach(option => {
          doc.fontSize(12).text(`  ${option}`);
        });
        doc.moveDown(0.5);
      }
      
      // Yeni sayfaya geç (her 3 sorudan sonra veya sayfa doluysa)
      if ((index + 1) % 3 === 0 && index < exam.questions.length - 1) {
        doc.addPage();
      } else {
        doc.moveDown();
      }
    });
    
    // PDF'i sonlandır
    doc.end();
  } catch (error) {
    console.error('PDF oluşturma hatası:', error);
    res.status(500).json({ message: error.message });
  }
};
