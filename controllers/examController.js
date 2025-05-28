// This controller will handle all exam-related operations
const Exam = require('../models/Exam');
const axios = require('axios');

// Dışarıdan soru çekme fonksiyonu - Open Trivia Database API kullanıyoruz
const fetchQuestionsFromAPI = async (questionCount, category, difficulty) => {
  try {
    console.log(`Trivia API'den sorular çekiliyor: ${questionCount} adet soru, kategori: ${category}, zorluk: ${difficulty}`);
    console.log('questionCount tipi:', typeof questionCount);
    
    // Kategori eşleştirmeleri
    const categoryMapping = {
      'Matematik': 19, // Science: Mathematics
      'Tarih': 23, // History
      'Coğrafya': 22, // Geography
      'Bilim': 17, // Science & Nature
      'Spor': 21, // Sports
      'Sanat': 25, // Art
      'Genel Kültür': 9, // General Knowledge
      'Bilgisayar': 18, // Science: Computers
    };
    
    // Zorluk seviyesi eşleştirmeleri
    const difficultyMapping = {
      'Kolay': 'easy',
      'Orta': 'medium',
      'Zor': 'hard'
    };
    
    // Sayıya çevir
    const amount = parseInt(questionCount) || 5; // Eğer dönüştürme başarısız olursa varsayılan 5 kullan
    
    // API parametrelerini hazırla
    const apiCategory = categoryMapping[category] || '';
    const apiDifficulty = difficultyMapping[difficulty] || '';
    
    // Open Trivia Database API'ye istek gönder
    const apiUrl = `https://opentdb.com/api.php?amount=${amount}`
      + (apiCategory ? `&category=${apiCategory}` : '')
      + (apiDifficulty ? `&difficulty=${apiDifficulty}` : '')
      + '&type=multiple';
    
    console.log(`API URL: ${apiUrl}`);
    
    const response = await axios.get(apiUrl);
    console.log('API yanıtı alındı:', response.status);
    console.log('API yanıt kodu:', response.data.response_code);
    
    if (response.data.response_code !== 0) {
      throw new Error(`API hatası: ${response.data.response_code}`);
    }
    
    // API yanıtını bizim formatımıza dönüştür
    return response.data.results.map((q, index) => {
      // Tüm seçenekleri birleştir ve karıştır
      const allOptions = [...q.incorrect_answers, q.correct_answer];
      
      // Seçenekleri karıştır
      for (let i = allOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
      }
      
      // Seçenekleri harflendir (A, B, C, D)
      const options = allOptions.map((option, idx) => {
        const letter = String.fromCharCode(65 + idx); // ASCII: A=65, B=66, ...
        return `${letter}) ${option}`;
      });
      
      // Doğru cevabın harfini bul
      const correctIndex = allOptions.findIndex(option => option === q.correct_answer);
      const correctLetter = String.fromCharCode(65 + correctIndex);
      
      return {
        id: `q${index + 1}`,
        text: q.question,
        type: 'çoktan_seçmeli',
        options: options,
        correctAnswer: `${correctLetter}) ${q.correct_answer}`,
        explanation: `Doğru cevap: ${q.correct_answer}`
      };
    });
  } catch (error) {
    console.error('Trivia API hatası:', error);
    // Hata durumunda boş dizi dön
    return [];
  }
};

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

// Generate exam with external API
exports.generateExamWithAI = async (req, res) => {
  try {
    const { level, subject, questionCount, questionTypes } = req.body;
    
    console.log('Request body:', req.body);
    
    if (!level || !subject || !questionCount) {
      console.log('Eksik parametreler:', { level, subject, questionCount });
      return res.status(400).json({ message: 'Seviye, konu ve soru sayısı gereklidir' });
    }
    
    console.log(`Soru üretiliyor: ${level} seviyesinde ${subject} konusu için ${questionCount} adet soru`);
    
    let questions = [];
    try {
      // Open Trivia Database API'den soruları çek
      questions = await fetchQuestionsFromAPI(questionCount, subject, level);
      
      console.log(`${questions.length} adet soru çekildi`);
      
      if (questions.length === 0) {
        return res.status(500).json({ message: 'API\'den soru çekilemedi. Lütfen daha sonra tekrar deneyin.' });
      }
      
      console.log('Sorular başarıyla çekildi');
    } catch (apiError) {
      console.error('API çağrısı hatası:', apiError);
      return res.status(500).json({ message: 'Dış API ile iletişim kurulurken bir hata oluştu', error: apiError.message });
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
