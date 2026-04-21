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
            await seed(); 
            console.log('🚀 Database initialized via Render');
        } catch (seedErr) {
            console.error('❌ Seed Error:', seedErr);
        }
    })
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- API ROUTES ---
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, '1index.html')); });

app.get('/api/doctors', async (req, res) => {
    try { res.json(await Doctor.find()); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/doctors/login', async (req, res) => {
    const { name } = req.body;
    try {
        const doctor = await Doctor.findOne({ name: { $regex: new RegExp('^' + name + '$', 'i') } });
        doctor ? res.json({ success: true, doctor }) : res.status(404).json({ success: false });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/patients/register', async (req, res) => {
    const { name, age, contact, problem, assignedDoctor } = req.body;
    try {
        const lastPatient = await Patient.findOne().sort({ token: -1 });
        const token = lastPatient ? lastPatient.token + 1 : 1;
        const newPatient = new Patient({ token, name, age, contact, problem, assignedDoctor, status: 'waiting' });
        await newPatient.save();
        res.status(201).json({ success: true, patient: newPatient });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/patients/queue', async (req, res) => {
    try { res.json(await Patient.find({ status: { $ne: 'completed' } }).populate('assignedDoctor').sort({ token: 1 })); } 
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/patients/:id/status', async (req, res) => {
    try {
        const patient = await Patient.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        io.emit('patient_updated', patient);
        res.json({ success: true, patient });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/beds', async (req, res) => {
    try { res.json(await Bed.find().populate('patient')); } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => { console.log(`🚀 Server running on port ${PORT}`); });