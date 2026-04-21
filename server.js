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
const Prescription = require('./models/Prescription');
const Staff = require('./models/Staff');

// Import Seeding Logic
const seed = require('./seed');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.static(__dirname));

// --- DATABASE CONNECTION & AUTO-SEED ---
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartcare_hms';

mongoose.connect(mongoURI)
    .then(async () => {
        console.log('✅ MongoDB Connected Successfully');
        try {
            // This ensures data is present in Atlas even if you can't seed locally
            await seed(); 
            console.log('🚀 Database initialized/checked via Render');
        } catch (seedErr) {
            console.error('❌ Seed Error:', seedErr);
        }
    })
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- ROOT ROUTE ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '1index.html'));
});

// --- DOCTOR APIs ---
app.get('/api/doctors', async (req, res) => {
    try {
        const doctors = await Doctor.find();
        res.json(doctors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/doctors/login', async (req, res) => {
    const { name } = req.body;
    try {
        const doctor = await Doctor.findOne({ name: { $regex: new RegExp('^' + name + '$', 'i') } });
        if (doctor) {
            res.json({ success: true, doctor });
        } else {
            res.status(404).json({ success: false, message: 'Doctor not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/doctors/:id/patients', async (req, res) => {
    try {
        const patients = await Patient.find({ assignedDoctor: req.params.id, status: 'waiting' }).sort({ token: 1 });
        res.json(patients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PATIENT APIs ---
app.post('/api/patients/register', async (req, res) => {
    const { name, age, contact, problem, assignedDoctor, address, aadhar } = req.body;
    try {
        if (!assignedDoctor) return res.status(400).json({ error: 'Doctor assignment is required' });
        
        const doctor = await Doctor.findById(assignedDoctor);
        if (!doctor) return res.status(400).json({ error: 'Selected doctor not found' });

        const lastPatient = await Patient.findOne().sort({ token: -1 });
        const token = lastPatient ? lastPatient.token + 1 : 1;

        const newPatient = new Patient({
            token, name, age, contact: contact || 'N/A', problem, assignedDoctor: doctor._id, 
            address: address || 'N/A', 
            aadhar: aadhar || '[Aadhaar Redacted]'
        });

        await newPatient.save();
        res.status(201).json({ success: true, patient: newPatient, doctor });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/patients/queue', async (req, res) => {
    try {
        const queue = await Patient.find({ status: { $ne: 'completed' } })
            .populate('assignedDoctor', 'name specialization')
            .sort({ token: 1 });
        res.json(queue);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/patients/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        const updateData = { status };
        if (status === 'completed') updateData.completedAt = new Date();
        const patient = await Patient.findByIdAndUpdate(req.params.id, updateData, { new: true });
        io.emit('patient_updated', patient);
        res.json({ success: true, patient });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- BED APIs ---
app.get('/api/beds', async (req, res) => {
    try {
        const beds = await Bed.find().populate('patient');
        res.json(beds);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/beds/:id', async (req, res) => {
    const { status, patient } = req.body;
    try {
        const bed = await Bed.findById(req.params.id);
        if (!bed) return res.status(404).json({ error: 'Bed not found' });
        
        bed.status = status;
        bed.patient = patient || null;
        await bed.save();

        const populatedBed = await Bed.findById(req.params.id).populate('patient');
        io.emit('bed_updated', populatedBed);
        res.json({ success: true, bed: populatedBed });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN APIs ---
app.get('/api/admin/stats', async (req, res) => {
    try {
        const patientCount = await Patient.countDocuments();
        const docCount = await Doctor.countDocuments();
        const staffCount = await Staff.countDocuments();