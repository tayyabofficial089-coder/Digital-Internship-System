const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create directories
const createDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

createDir('uploads/cvs');
createDir('uploads/progress');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'uploads/';
        if (file.fieldname === 'cv') {
            folder = 'uploads/cvs/';
        } else if (file.fieldname === 'file' || file.fieldname === 'progressFile') {
            folder = 'uploads/progress/';
        }
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s/g, '_'));
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, DOC, DOCX, JPEG, PNG files are allowed'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: fileFilter
});

module.exports = upload;