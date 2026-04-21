const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

// Define app FIRST
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Import Models
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const Bed = require('./models/Bed');
const Medicine = require('./models/Medicine');
const Staff = require('./models/Staff');

const seed = require('./seed');

// Middlewares
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.static(__dirname));

// DATABASE CONNECTION
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartcare_hms';

mongoose.connect(mongoURI)
    .then(async () => {
        console.log('✅ MongoDB Connected Successfully');
        try { await seed(); console.log('🚀 Database Seeded'); } catch (e) { console.error(e); }
    })
    .catch(err => console.error('❌ MongoDB Error:', err));

// --- ROOT ROUTE (Fixes "Cannot GET /") ---
// Ensure the filename below matches your main file (1index.html or index.html)
app.get('/', (req, res) => { 
    res.sendFile(path.join(__dirname, '1index.html')); 
});

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
app.post('/api/admin/register-staff', async (req, res) => {
    try {
        const { role, name } = req.body;
        
        // This handles saving to the correct MongoDB Collection
        const Model = role === 'doctor' ? Doctor : Staff;
        
        const newUser = new Model({
            ...req.body,
            // Ensure ID is generated correctly based on role
            id: role === 'doctor' ? 'DOC-' + Date.now() : 'STAFF-' + Date.now()
        });

        await newUser.save();
        res.json({ success: true, user: newUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
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
// --- BED MANAGEMENT ROUTES ---
app.get('/api/beds', async (req, res) => {
    try { 
        const beds = await Bed.find().populate('patient');
        res.json(beds); 
    } catch (err) { res.status(500).json(err); }
});

app.put('/api/beds/:id', async (req, res) => {
    try {
        const bed = await Bed.findByIdAndUpdate(req.params.id, req.body, { new: true });
        io.emit('bed_updated', bed); // Sends real-time update to all dashboards
        res.json(bed);
    } catch (err) { res.status(500).json(err); }
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => { console.log(`🚀 Server live on port ${PORT}`); });