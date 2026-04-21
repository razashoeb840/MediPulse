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
        try { 
            await seed(); 
            console.log('🚀 Database Seeded/Initialized'); 
        } catch (e) { 
            console.error('❌ Seeding Error:', e); 
        }
    })
    .catch(err => console.error('❌ MongoDB Error:', err));

// --- ROOT ROUTE ---
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
    try { 
        res.json(await Patient.find({ status: { $ne: 'completed' } })
            .populate('assignedDoctor')
            .sort({ token: 1 })); 
    } catch (err) { res.status(500).json(err); }
});

app.get('/api/patients/all', async (req, res) => {
    try {
        const history = await Patient.find().populate('assignedDoctor').sort({ createdAt: -1 });
        res.json(history);
    } catch (err) { res.status(500).json(err); }
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
        const occupiedBeds = await Bed.countDocuments({ status: 'occ' });
        res.json({ 
            patients, 
            doctors, 
            staff, 
            bedOccupancyPercentage: Math.round((occupiedBeds/30)*100), 
            inventoryValue: 4500 
        });
    } catch (err) { res.status(500).json(err); }
});

app.get('/api/admin/staff', async (req, res) => {
    try {
        // Combined list for the frontend staff directory
        const docs = await Doctor.find();
        const others = await Staff.find();
        
        // Ensure both have an 'id' field for frontend s.id.startsWith() logic
        const formattedDocs = docs.map(d => ({ ...d._doc, id: d.id || `DOC-${d._id.toString().slice(-4)}` }));
        const formattedOthers = others.map(s => ({ ...s._doc, id: s.id || `REC-${s._id.toString().slice(-4)}` }));
        
        res.json([...formattedDocs, ...formattedOthers]);
    } catch (err) { res.status(500).json(err); }
});

app.post('/api/admin/register-staff', async (req, res) => {
    try {
        const { role, name } = req.body;
        const timestamp = Date.now().toString().slice(-6);
        
        if (role === 'doctor') {
            const newDoctor = new Doctor({
                ...req.body,
                id: `DOC-${timestamp}`, // Crucial for frontend logic
                isActive: true
            });
            await newDoctor.save();
            return res.json({ success: true, user: newDoctor });
        } else {
            const newStaff = new Staff({ 
                ...req.body,
                id: `REC-${timestamp}` // Crucial for frontend logic
            });
            await newStaff.save();
            return res.json({ success: true, user: newStaff });
        }
    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/admin/staff/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let deleted;
        if (id.startsWith('DOC')) {
            deleted = await Doctor.findOneAndDelete({ id });
        } else {
            deleted = await Staff.findOneAndDelete({ id });
        }
        res.json({ success: !!deleted });
    } catch (err) { res.status(500).json({ success: false }); }
});

// --- BED MANAGEMENT ROUTES ---
app.get('/api/beds', async (req, res) => {
    try { 
        res.json(await Bed.find().populate('patient')); 
    } catch (err) { res.status(500).json(err); }
});

app.put('/api/beds/:id', async (req, res) => {
    try {
        const bed = await Bed.findByIdAndUpdate(req.params.id, req.body, { new: true });
        io.emit('bed_updated', bed); 
        res.json(bed);
    } catch (err) { res.status(500).json(err); }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => { console.log(`🚀 Server live on port ${PORT}`); });