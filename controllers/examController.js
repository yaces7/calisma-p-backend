// This controller will handle all exam-related operations
const Exam = require('../models/Exam');

// Yerel soru üretme fonksiyonu
const generateLocalQuestions = (level, subject, questionCount, questionTypes) => {
  // Konu havuzu - farklı konulara göre önceden hazırlanmış sorular
  const questionPool = {
    // Matematik soruları
    'Matematik - Türev': [
      {
        text: 'f(x) = x² fonksiyonunun türevi nedir?',
        type: 'çoktan_seçmeli',
        options: ['A) f\'(x) = 2x', 'B) f\'(x) = x', 'C) f\'(x) = 2x²', 'D) f\'(x) = x²'],
        correctAnswer: 'A) f\'(x) = 2x',
        explanation: 'Kuvvet kuralına göre, x² nin türevi 2x olur.'
      },
      {
        text: 'f(x) = sin(x) fonksiyonunun türevi nedir?',
        type: 'çoktan_seçmeli',
        options: ['A) f\'(x) = cos(x)', 'B) f\'(x) = -sin(x)', 'C) f\'(x) = tan(x)', 'D) f\'(x) = -cos(x)'],
        correctAnswer: 'A) f\'(x) = cos(x)',
        explanation: 'sin(x) fonksiyonunun türevi cos(x) dir.'
      },
      {
        text: 'f(x) = e^x fonksiyonunun türevi nedir?',
        type: 'çoktan_seçmeli',
        options: ['A) f\'(x) = e^x', 'B) f\'(x) = x·e^x', 'C) f\'(x) = e^(x-1)', 'D) f\'(x) = xe^(x-1)'],
        correctAnswer: 'A) f\'(x) = e^x',
        explanation: 'e^x fonksiyonunun türevi yine kendisidir, yani e^x dir.'
      },
      {
        text: 'f(x) = ln(x) fonksiyonunun türevi nedir?',
        type: 'çoktan_seçmeli',
        options: ['A) f\'(x) = 1/x', 'B) f\'(x) = x', 'C) f\'(x) = 1', 'D) f\'(x) = ln(x-1)'],
        correctAnswer: 'A) f\'(x) = 1/x',
        explanation: 'ln(x) fonksiyonunun türevi 1/x dir.'
      },
      {
        text: 'f(x) = x³ + 2x² - 5x + 3 fonksiyonunun türevi nedir?',
        type: 'çoktan_seçmeli',
        options: ['A) f\'(x) = 3x² + 4x - 5', 'B) f\'(x) = 3x² + 4x + 5', 'C) f\'(x) = 3x² + 2x - 5', 'D) f\'(x) = 3x² + 4x'],
        correctAnswer: 'A) f\'(x) = 3x² + 4x - 5',
        explanation: 'Polinomun terim terim türevi alınır. x³ ün türevi 3x², 2x² nin türevi 4x, -5x in türevi -5, sabit terimin türevi 0 dır.'
      },
      {
        text: 'Türev alma işleminde zincir kuralı ne için kullanılır?',
        type: 'açık_uçlu',
        correctAnswer: 'Zincir kuralı, bir fonksiyonun içine başka bir fonksiyon yerleştirildiğinde (bileşik fonksiyon) türev almak için kullanılır.',
        explanation: 'Eğer f(g(x)) şeklinde bir bileşik fonksiyon varsa, türevi f\'(g(x)) · g\'(x) olur.'
      },
      {
        text: 'f(x) = x² + 3x + 2 fonksiyonunun x = 1 noktasındaki teğetinin denklemi nedir?',
        type: 'çoktan_seçmeli',
        options: ['A) y = 5x - 2', 'B) y = 5x', 'C) y = 5x + 1', 'D) y = 5x - 1'],
        correctAnswer: 'A) y = 5x - 2',
        explanation: 'f\'(x) = 2x + 3, f\'(1) = 2·1 + 3 = 5. Teğetin denklemi y - f(1) = f\'(1)(x - 1). f(1) = 1² + 3·1 + 2 = 6. Demek ki y - 6 = 5(x - 1) => y = 5x - 5 + 6 => y = 5x + 1.'
      },
      {
        text: 'Bir fonksiyonun ikinci türevi pozitifse, fonksiyon bu aralıkta nasıl bir davranış gösterir?',
        type: 'çoktan_seçmeli',
        options: ['A) Yukarı doğru içbükey', 'B) Aşağı doğru içbükey', 'C) Artan', 'D) Azalan'],
        correctAnswer: 'A) Yukarı doğru içbükey',
        explanation: 'Bir fonksiyonun ikinci türevi pozitifse, fonksiyon yukarı doğru içbükey (konveks) olur.'
      },
      {
        text: 'f(x) = x² - 4x + 4 fonksiyonunun minimum değerini bulunuz.',
        type: 'çoktan_seçmeli',
        options: ['A) 0', 'B) 4', 'C) -4', 'D) 2'],
        correctAnswer: 'A) 0',
        explanation: 'f\'(x) = 2x - 4. Kritik nokta için f\'(x) = 0 => 2x - 4 = 0 => x = 2. f(2) = 2² - 4·2 + 4 = 4 - 8 + 4 = 0. İkinci türev f"(x) = 2 > 0 olduğundan bu bir minimum noktasıdır.'
      },
      {
        text: 'Türev alma işleminde çarpım kuralı nasıl ifade edilir?',
        type: 'boşluk_doldurma',
        correctAnswer: '(f·g)\'(x) = f\'(x)·g(x) + f(x)·g\'(x)',
        explanation: 'İki fonksiyonun çarpımının türevi, birinci fonksiyonun türevi ile ikinci fonksiyon çarpımı artı birinci fonksiyon ile ikinci fonksiyonun türevi çarpımına eşittir.'
      }
    ],
    'Fizik - Mekanik': [
      {
        text: 'Bir cismin ivmesi nedir?',
        type: 'çoktan_seçmeli',
        options: ['A) Hızın zamana göre değişimi', 'B) Konumun zamana göre değişimi', 'C) Kuvvetin kütleye oranı', 'D) Momentumun zamana göre değişimi'],
        correctAnswer: 'A) Hızın zamana göre değişimi',
        explanation: 'İvme, hızın zamana göre türevi olarak tanımlanır.'
      },
      {
        text: 'Newton\'un ikinci hareket yasası neyi ifade eder?',
        type: 'çoktan_seçmeli',
        options: ['A) F = m·a', 'B) F = m/a', 'C) F = m·v', 'D) F = m·g'],
        correctAnswer: 'A) F = m·a',
        explanation: 'Newton\'un ikinci yasası, bir cisme etki eden net kuvvetin, cismin kütlesi ile ivmesinin çarpımına eşit olduğunu belirtir.'
      },
      {
        text: 'Bir cismin potansiyel enerjisi neye bağlıdır?',
        type: 'çoktan_seçmeli',
        options: ['A) Yükseklik, kütle ve yerçekimi ivmesi', 'B) Sadece hız', 'C) Sadece kütle', 'D) Sadece yükseklik'],
        correctAnswer: 'A) Yükseklik, kütle ve yerçekimi ivmesi',
        explanation: 'Yerçekimi potansiyel enerjisi E = m·g·h formülü ile hesaplanır.'
      },
      {
        text: 'Bir cismin kinetik enerjisi neye bağlıdır?',
        type: 'çoktan_seçmeli',
        options: ['A) Kütle ve hızın karesi', 'B) Sadece kütle', 'C) Sadece hız', 'D) Kütle ve hız'],
        correctAnswer: 'A) Kütle ve hızın karesi',
        explanation: 'Kinetik enerji E = (1/2)·m·v² formülü ile hesaplanır.'
      },
      {
        text: 'Momentum korunumu ilkesi neyi ifade eder?',
        type: 'açık_uçlu',
        correctAnswer: 'Dış kuvvetlerin etki etmediği bir sistemde, toplam momentum sabit kalır.',
        explanation: 'Çarpışma öncesi ve sonrası toplam momentum korunur, yani m₁v₁ + m₂v₂ = m₁v₁\'+ m₂v₂\'.'
      }
    ],
    'Türkçe - Dilbilgisi': [
      {
        text: 'Aşağıdaki cümlelerden hangisinde özne yanlış bulunmuştur?',
        type: 'çoktan_seçmeli',
        options: ['A) Kuşlar gökyüzünde uçuyordu.', 'B) Güzel bir film izledik.', 'C) Bahçedeki çiçekler açmış.', 'D) Yarın okula gidecek.'],
        correctAnswer: 'D) Yarın okula gidecek.',
        explanation: 'D seçeneğinde özne belli değildir, gizli öznedir.'
      },
      {
        text: 'Aşağıdaki cümlelerden hangisinde yazım yanlışı vardır?',
        type: 'çoktan_seçmeli',
        options: ['A) Hiç bir şey söylemedi.', 'B) Bu akşam size geleceğim.', 'C) Türkçe sınavından yüz aldı.', 'D) Pazartesi günü tatil olacak.'],
        correctAnswer: 'A) Hiç bir şey söylemedi.',
        explanation: '"Hiçbir" sözcüğü bitişik yazılır.'
      }
    ]
  };
  
  // Konu havuzunda ilgili konu yoksa, genel sorular kullan
  const generalQuestions = [
    {
      text: 'Bu bir örnek çoktan seçmeli sorudur?',
      type: 'çoktan_seçmeli',
      options: ['A) Birinci seçenek', 'B) İkinci seçenek', 'C) Üçüncü seçenek', 'D) Dördüncü seçenek'],
      correctAnswer: 'A) Birinci seçenek',
      explanation: 'Bu sorunun açıklaması burada yer alacak.'
    },
    {
      text: 'Bu bir örnek doğru/yanlış sorudur?',
      type: 'doğru_yanlış',
      options: ['Doğru', 'Yanlış'],
      correctAnswer: 'Doğru',
      explanation: 'Bu sorunun açıklaması burada yer alacak.'
    },
    {
      text: 'Bu bir örnek boşluk doldurma sorudur: __________ boşluğu doldurun.',
      type: 'boşluk_doldurma',
      correctAnswer: 'Doğru cevap',
      explanation: 'Bu sorunun açıklaması burada yer alacak.'
    },
    {
      text: 'Bu bir örnek açık uçlu sorudur?',
      type: 'açık_uçlu',
      correctAnswer: 'Örnek cevap burada yer alacak.',
      explanation: 'Bu sorunun açıklaması burada yer alacak.'
    }
  ];
  
  // Konuya göre soruları seç
  let availableQuestions = questionPool[subject] || generalQuestions;
  
  // Soru tipine göre filtreleme
  if (questionTypes && questionTypes.length > 0) {
    availableQuestions = availableQuestions.filter(q => questionTypes.includes(q.type));
  }
  
  // Yeterli soru yoksa, genel sorularla tamamla
  if (availableQuestions.length < questionCount) {
    const remainingCount = questionCount - availableQuestions.length;
    const filteredGeneralQuestions = generalQuestions.filter(q => questionTypes.includes(q.type));
    
    for (let i = 0; i < remainingCount; i++) {
      const randomIndex = Math.floor(Math.random() * filteredGeneralQuestions.length);
      availableQuestions.push(filteredGeneralQuestions[randomIndex]);
    }
  }
  
  // İstenen sayıda soru seç
  const selectedQuestions = [];
  const maxQuestions = Math.min(questionCount, availableQuestions.length);
  
  // Rastgele soru seçimi
  const indices = new Set();
  while (indices.size < maxQuestions) {
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    indices.add(randomIndex);
  }
  
  // Seçilen soruları ekle
  indices.forEach(index => {
    selectedQuestions.push({
      ...availableQuestions[index],
      id: `q${selectedQuestions.length + 1}`
    });
  });
  
  return selectedQuestions;
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

// Generate exam with predefined questions
exports.generateExamWithAI = async (req, res) => {
  try {
    const { level, subject, questionCount, questionTypes } = req.body;
    
    if (!level || !subject || !questionCount) {
      return res.status(400).json({ message: 'Seviye, konu ve soru sayısı gereklidir' });
    }
    
    console.log(`Soru üretiliyor: ${level} seviyesinde ${subject} konusu için ${questionCount} adet soru`);
    
    // Yerel soru havuzu - konu ve seviyeye göre önceden hazırlanmış sorular
    const questions = generateLocalQuestions(level, subject, questionCount, questionTypes);
    
    console.log(`${questions.length} adet soru üretildi`);
    
    if (questions.length === 0) {
      return res.status(500).json({ message: 'Soru üretilemedi' });
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
