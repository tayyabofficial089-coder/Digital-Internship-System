const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ✅ MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ SERVE STATIC FILES (SAB FRONTEND FILES SERVE HONGI)
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ API ROUTES (JO AAPKE PAS PEHLE SE HAIN)
const authRoutes = require('./src/routes/authRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const companyRoutes = require('./src/routes/companyRoutes');
const supervisorRoutes = require('./src/routes/supervisorRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/supervisor', supervisorRoutes);
app.use('/api/admin', adminRoutes);

// ✅ DEFAULT ROUTE - HOME PAGE
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ✅ ALL OTHER PAGES - DIRECT ACCESS
app.get('*', (req, res) => {
    const filePath = path.join(__dirname, '../frontend', req.path);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).send('File not found');
        }
    });
});

// ✅ START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});