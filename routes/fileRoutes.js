const express = require('express');
const router = express.Router();
const { upload, deleteFile, getFileStream, getFileInfo, listFiles } = require('../utils/fileStorage');
const auth = require('../middleware/auth');

// Dosya yükleme
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Lütfen bir dosya yükleyin' });
    }
    
    // Dosya bilgilerini döndür
    res.status(201).json({
      success: true,
      message: 'Dosya başarıyla yüklendi',
      file: {
        id: req.file.id,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Birden fazla dosya yükleme
router.post('/upload/multiple', auth, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Lütfen en az bir dosya yükleyin' });
    }
    
    // Dosya bilgilerini döndür
    const fileInfos = req.files.map(file => ({
      id: file.id,
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    }));
    
    res.status(201).json({
      success: true,
      message: 'Dosyalar başarıyla yüklendi',
      files: fileInfos
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Dosya indirme
router.get('/download/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const fileInfo = await getFileInfo(fileId);
    
    // Content-Type ve Content-Disposition header'larını ayarla
    res.set('Content-Type', fileInfo.contentType);
    res.set('Content-Disposition', `attachment; filename="${fileInfo.metadata.originalName}"`);
    
    // Dosya stream'ini response'a pipe et
    const downloadStream = getFileStream(fileId);
    downloadStream.pipe(res);
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

// Dosyayı tarayıcıda görüntüleme
router.get('/view/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const fileInfo = await getFileInfo(fileId);
    
    // Content-Type header'ını ayarla
    res.set('Content-Type', fileInfo.contentType);
    
    // Dosya stream'ini response'a pipe et
    const downloadStream = getFileStream(fileId);
    downloadStream.pipe(res);
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

// Dosya silme
router.delete('/:id', auth, async (req, res) => {
  try {
    const fileId = req.params.id;
    const result = await deleteFile(fileId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Tüm dosyaları listeleme (sadece admin veya öğretmen)
router.get('/list', auth, async (req, res) => {
  try {
    // Kullanıcı rolünü kontrol et (gerçek uygulamada bu kontrol auth middleware'inde yapılabilir)
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bu işlem için yetkiniz yok' });
    }
    
    // Filtre parametrelerini al
    const filter = {};
    if (req.query.uploadedBy) {
      filter['metadata.uploadedBy'] = req.query.uploadedBy;
    }
    if (req.query.contentType) {
      filter['metadata.contentType'] = new RegExp(req.query.contentType, 'i');
    }
    
    const files = await listFiles(filter);
    res.status(200).json({ success: true, files });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Kullanıcının kendi dosyalarını listeleme
router.get('/my-files', auth, async (req, res) => {
  try {
    const filter = { 'metadata.uploadedBy': req.user.id };
    const files = await listFiles(filter);
    res.status(200).json({ success: true, files });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
