const jwt = require('jsonwebtoken');

// Kimlik doğrulama middleware
const auth = (req, res, next) => {
  try {
    // Token'ı header'dan al
    const token = req.header('x-auth-token');
    
    // Token yoksa erişimi reddet
    if (!token) {
      return res.status(401).json({ success: false, message: 'Erişim tokeni bulunamadı, yetkilendirme reddedildi' });
    }
    
    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Kullanıcı bilgisini request'e ekle
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Geçersiz token' });
  }
};

module.exports = auth;
