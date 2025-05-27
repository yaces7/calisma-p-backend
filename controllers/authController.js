// This controller will handle all authentication-related operations
const admin = require('firebase-admin');
const User = require('../models/User');

// Initialize Firebase Admin (will be properly configured in a separate file)
// Note: This is just a placeholder. We'll set up proper Firebase initialization in config/firebase.js
if (!admin.apps.length) {
  admin.initializeApp({
    // Firebase configuration will be loaded from environment variables
  });
}

// Register a new user
exports.register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    if (!email || !password || !name || !role) {
      return res.status(400).json({ message: 'Tüm alanlar gereklidir' });
    }
    
    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });
    
    // Create user in our database
    const newUser = new User({
      firebaseUid: userRecord.uid,
      email,
      name,
      role, // 'teacher' or 'student'
      createdAt: new Date(),
    });
    
    await newUser.save();
    
    // Set custom claims for role-based access control
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });
    
    res.status(201).json({ message: 'Kullanıcı başarıyla oluşturuldu' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  // Firebase Authentication is handled on the client side
  // This endpoint is just for additional server-side validation if needed
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ message: 'ID token gereklidir' });
    }
    
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Get user from our database
    const user = await User.findOne({ firebaseUid: uid });
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    res.status(200).json({
      message: 'Giriş başarılı',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    res.status(401).json({ message: 'Giriş başarısız', error: error.message });
  }
};

// Logout
exports.logout = (req, res) => {
  // Firebase Authentication logout is handled on the client side
  res.status(200).json({ message: 'Çıkış başarılı' });
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    // The Firebase Auth middleware will add the user to the request
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
