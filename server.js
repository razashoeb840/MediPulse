const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

// Import Models
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const Bed = require('./models/Bed');
const Medicine = require('./models/Medicine');
const Staff = require('./models/Staff');

const seed = require('./seed');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.static(__dirname));

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartcare_hms';

mongoose.connect(mongoURI)
    .then(async () => {
        console.log('✅ MongoDB Connected Successfully');
        try { await seed(); console.log('🚀 Database Seeded'); } catch (e) { console.error(e); }
    })
    .catch(err => console.error('❌ MongoDB Error:', err));

// --- DOCTOR ROUTES ---
app.get('/api/doctors', async (req, res) => {
    try { res.json(await Doctor.find()); } catch (err) { res.status(500).json(err); }
});

app.post('/api/doctors/login', async (req, res) => {
    const { name } = req.body;
    try {
        const doctor = await Doctor.findOne({ name: { $regex: new RegExp('^' + name + '$', 'i') } });
        doctor ? res.json({ success: true, doctor }) : res.status(404).json({ success: false });
    } catch (err) { res.status(500).json(err); }
});

// --- PATIENT & QUEUE ROUTES ---
app.post('/api/patients/register', async (req, res) => {
    try {
        const lastPatient = await Patient.findOne().sort({ token: -1 });
        const token = (lastPatient && lastPatient.token) ? lastPatient.token + 1 : 1;
        const newPatient = new Patient({ ...req.body, token, status: 'waiting' });
        await newPatient.save();
        res.status(201).json({ success: true, patient: newPatient });
    } catch (err) { res.status(500).json(err); }
});

app.get('/api/patients/queue', async (req, res) => {
    try { res.json(await Patient.find({ status: { $ne: 'completed' } }).populate('assignedDoctor').sort({ token: 1 })); } 
    catch (err) { res.status(500).json(err); }
});

// --- MEDICINE / PHARMACY ROUTES ---
app.get('/api/medicines', async (req, res) => {
    try { res.json(await Medicine.find()); } catch (err) { res.status(500).json(err); }
});

app.post('/api/medicines', async (req, res) => {
    try {
        const newMed = new Medicine(req.body);
        await newMed.save();
        res.json({ success: true, medicine: newMed });
    } catch (err) { res.status(500).json(err); }
});

// --- ADMIN & STAFF ROUTES ---
app.get('/api/admin/stats', async (req, res) => {
    try {
        const patients = await Patient.countDocuments();
        const doctors = await Doctor.countDocuments();
        const staff = await Staff.countDocuments();
        const beds = await Bed.countDocuments({ status: 'occ' });
        res.json({ patients, doctors, staff, bedOccupancyPercentage: Math.round((beds/30)*100), inventoryValue: 4500 });
    } catch (err) { res.status(500).json(err); }
});

app.get('/api/admin/staff', async (req, res) => {
    try { res.json(await Staff.find()); } catch (err) { res.status(500).json(err); }
});

app.post('/api/admin/register-staff', async (req, res) => {
    try {
        const newStaff = new Staff(req.body);
        newStaff.id = req.body.role === 'doctor' ? 'DOC-' + Date.now() : 'REC-' + Date.now();
        await newStaff.save();
        res.json({ success: true, user: newStaff });
    } catch (err) { res.status(500).json(err); }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => { console.log(`🚀 Server live on port ${PORT}`); });