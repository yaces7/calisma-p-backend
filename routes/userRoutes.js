const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Kullanıcı profili bilgilerini getirme
router.get('/profile', auth, async (req, res) => {
  try {
    // req.user, auth middleware'i tarafından ekleniyor
    // Gerçek uygulamada veritabanından kullanıcı bilgilerini alacağız
    // Şimdilik sadece token'dan gelen bilgileri döndürüyoruz
    res.json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Kullanıcı profili güncelleme
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Gerçek uygulamada veritabanında kullanıcı bilgilerini güncelleyeceğiz
    // Şimdilik başarılı bir yanıt döndürüyoruz
    res.json({
      success: true,
      message: 'Profil başarıyla güncellendi',
      user: {
        id: req.user.id,
        name: name || req.user.name,
        email: email || req.user.email
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Kullanıcı listesi (sadece admin)
router.get('/', auth, async (req, res) => {
  try {
    // Kullanıcı rolünü kontrol et
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok' });
    }
    
    // Gerçek uygulamada veritabanından kullanıcı listesini alacağız
    // Şimdilik örnek bir liste döndürüyoruz
    res.json({
      success: true,
      users: [
        { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
        { id: '2', name: 'Teacher User', email: 'teacher@example.com', role: 'teacher' },
        { id: '3', name: 'Student User', email: 'student@example.com', role: 'student' }
      ]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
