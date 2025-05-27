const admin = require('../config/firebase');
const User = require('../models/User');

// Middleware to verify Firebase ID token
exports.verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Yetkilendirme başarısız: Token bulunamadı' });
  }
  
  const idToken = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || 'student' // Default to student if role not set
    };
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Yetkilendirme başarısız: Geçersiz token', error: error.message });
  }
};

// Middleware to check if user is a teacher
exports.isTeacher = (req, res, next) => {
  if (req.user && req.user.role === 'teacher') {
    next();
  } else {
    res.status(403).json({ message: 'Bu işlem için öğretmen yetkisi gerekiyor' });
  }
};

// Middleware to check if user is a student
exports.isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    res.status(403).json({ message: 'Bu işlem için öğrenci yetkisi gerekiyor' });
  }
};

// Middleware to check if user is an admin
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Bu işlem için yönetici yetkisi gerekiyor' });
  }
};

// Middleware to attach full user data from our database
exports.attachUserData = async (req, res, next) => {
  if (!req.user || !req.user.uid) {
    return res.status(401).json({ message: 'Kullanıcı kimliği bulunamadı' });
  }
  
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı veritabanında bulunamadı' });
    }
    
    req.userData = user;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Kullanıcı verisi alınamadı', error: error.message });
  }
};
