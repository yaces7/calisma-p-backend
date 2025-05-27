const mongoose = require('mongoose');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');
const path = require('path');

// MongoDB bağlantı URL'si
const mongoURI = process.env.MONGODB_URI;

// GridFS depolama motoru oluşturma
const storage = new GridFsStorage({
  url: mongoURI,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      // Dosya adı için rastgele bir isim oluştur
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads', // GridFS bucket adı
          metadata: {
            originalName: file.originalname,
            uploadedBy: req.user ? req.user.id : 'anonymous',
            uploadDate: new Date(),
            contentType: file.mimetype
          }
        };
        resolve(fileInfo);
      });
    });
  }
});

// Dosya yükleme için multer middleware
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // İzin verilen dosya türleri
    const allowedFileTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx/;
    // Dosya uzantısını kontrol et
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    // MIME türünü kontrol et
    const mimetype = allowedFileTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Desteklenmeyen dosya türü! Lütfen jpeg, jpg, png, gif, pdf, doc, docx, xls, xlsx, ppt veya pptx dosyaları yükleyin.'));
    }
  }
});

// GridFS bağlantı ve bucket işlemleri
let gfs;
mongoose.connection.once('open', () => {
  // GridFS stream başlatma
  gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
});

// Dosya silme fonksiyonu
const deleteFile = async (fileId) => {
  try {
    if (!gfs) {
      throw new Error('GridFS bağlantısı henüz kurulmadı');
    }
    
    await gfs.delete(new mongoose.Types.ObjectId(fileId));
    return { success: true, message: 'Dosya başarıyla silindi' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Dosya indirme işlemi için stream oluşturma
const getFileStream = (fileId) => {
  if (!gfs) {
    throw new Error('GridFS bağlantısı henüz kurulmadı');
  }
  
  return gfs.openDownloadStream(new mongoose.Types.ObjectId(fileId));
};

// Dosya bilgilerini getirme
const getFileInfo = async (fileId) => {
  try {
    if (!mongoose.connection.db) {
      throw new Error('Veritabanı bağlantısı henüz kurulmadı');
    }
    
    const files = mongoose.connection.db.collection('uploads.files');
    const file = await files.findOne({ _id: new mongoose.Types.ObjectId(fileId) });
    
    if (!file) {
      throw new Error('Dosya bulunamadı');
    }
    
    return file;
  } catch (error) {
    throw error;
  }
};

// Tüm dosyaları listeleme
const listFiles = async (filter = {}) => {
  try {
    if (!mongoose.connection.db) {
      throw new Error('Veritabanı bağlantısı henüz kurulmadı');
    }
    
    const files = mongoose.connection.db.collection('uploads.files');
    return await files.find(filter).toArray();
  } catch (error) {
    throw error;
  }
};

module.exports = {
  upload,
  deleteFile,
  getFileStream,
  getFileInfo,
  listFiles
};
