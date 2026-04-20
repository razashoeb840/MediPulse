const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const Bed = require('./models/Bed');
const Medicine = require('./models/Medicine');
const Prescription = require('./models/Prescription');
const Staff = require('./models/Staff');

const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors({
    origin: "*"
}));
app.use(express.json());

// Serve static frontend files
app.use(express.static(__dirname));

// Route root to Main Dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '1index.html'));
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('Error connecting to MongoDB:', err));

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
        
        // Verify doctor exists
        const doctor = await Doctor.findById(assignedDoctor);
        if (!doctor) return res.status(400).json({ error: 'Selected doctor not found' });

        // Generate token
        const lastPatient = await Patient.findOne().sort({ token: -1 });
        const token = lastPatient ? lastPatient.token + 1 : 1;

        const newPatient = new Patient({
            token, name, age, contact: contact || 'N/A', problem, assignedDoctor: doctor._id, address: address || 'N/A', aadhar: aadhar || 'N/A'
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

app.get('/api/patients', async (req, res) => {
    try {
        const history = await Patient.find() 
            .populate('assignedDoctor', 'name specialization')
            .sort({ createdAt: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/patients/history', async (req, res) => {
    try {
        const history = await Patient.find() 
            .populate('assignedDoctor', 'name specialization')
            .sort({ createdAt: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/patients/:id', async (req, res) => {
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

app.put('/api/patients/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        const updateData = { status };
        if (status === 'completed') updateData.completedAt = new Date();
        const patient = await Patient.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json({ success: true, patient });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PRESCRIPTION APIs ---
app.post('/api/prescriptions', async (req, res) => {
    const { patientId, doctorId, medicines, notes } = req.body;
    try {
        const newPrescription = new Prescription({ patientId, doctorId, medicines, notes });
        await newPrescription.save();
        
        // Update patient status
        await Patient.findByIdAndUpdate(patientId, { status: 'prescribed', consultedAt: new Date() });

        res.status(201).json({ success: true, prescription: newPrescription });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/prescriptions/patient/:patientId', async (req, res) => {
    try {
        const prescription = await Prescription.findOne({ patientId: req.params.patientId })
            .populate('doctorId', 'name')
            .populate('patientId', 'name age')
            .sort({ createdAt: -1 });
        
        if (prescription) {
            res.json({ success: true, prescription });
        } else {
            res.status(404).json({ success: false, message: 'Prescription not found' });
        }
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

// --- MEDICINE APIs ---
app.get('/api/medicines', async (req, res) => {
    try {
        const medicines = await Medicine.find();
        res.json(medicines);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/medicines/sell', async (req, res) => {
    const { items } = req.body; // items: [{ name: 'Paracetamol', quantity: 2 }]
    try {
        // Verify stock first
        for (const item of items) {
            const med = await Medicine.findOne({ name: { $regex: new RegExp('^' + item.name + '$', 'i') } });
            if (!med || med.stock < item.quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for ${item.name}` });
            }
        }

        // Deduct stock
        for (const item of items) {
            await Medicine.updateOne(
                { name: { $regex: new RegExp('^' + item.name + '$', 'i') } },
                { $inc: { stock: -item.quantity } }
            );
        }

        res.json({ success: true, message: 'Medicines sold successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN APIS ---
app.post('/api/medicines', async (req, res) => {
    const { name, stock, price, category, illness, salesPerDay } = req.body;
    try {
        const newMed = new Medicine({ name, stock: parseInt(stock)||0, price: parseFloat(price)||0, category, illness, salesPerDay: parseInt(salesPerDay)||5 });
        await newMed.save();
        res.status(201).json({ success: true, medicine: newMed });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/medicines/:id', async (req, res) => {
    const { price, stockChange } = req.body;
    try {
        const medicine = await Medicine.findById(req.params.id);
        if (!medicine) return res.status(404).json({ error: 'Medicine not found' });
        
        if (price !== undefined && price !== '') medicine.price = parseFloat(price);
        if (stockChange !== undefined && stockChange !== '') medicine.stock += parseInt(stockChange, 10);
        
        await medicine.save();
        res.json({ success: true, medicine });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/stats', async (req, res) => {
    try {
        const patientCount = await Patient.countDocuments();
        const docCount = await Doctor.countDocuments();
        const staffCount = await Staff.countDocuments();
        
        const rawMeds = await Medicine.find();
        const totalMedStock = rawMeds.reduce((acc, med) => acc + (med.stock * med.price), 0);
        
        const beds = await Bed.find();
        let occupiedBeds = 0;
        let totalBeds = 0;
        beds.forEach(b => {
             occupiedBeds += b.occupied;
             totalBeds += b.total;
        });

        res.json({
            patients: patientCount,
            doctors: docCount,
            staff: staffCount,
            inventoryValue: totalMedStock,
            bedOccupancyPercentage: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
        });
    } catch(err) {
         res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/staff', async (req, res) => {
    try {
        const doctors = await Doctor.find().lean();
        const d_mapped = doctors.map(d => ({ id: d.doctorId, name: d.name, role: 'Doctor (' + d.specialization + ')' }));
        
        const staffList = await Staff.find().lean();
        const s_mapped = staffList.map(s => ({ id: s.staffId, name: s.name, role: s.role.toUpperCase() }));
        
        res.json([...d_mapped, ...s_mapped]);
    } catch(err) {
         res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/register-staff', async (req, res) => {
    const { name, role, specialization, experience, qualifications, contactNumber, address, aadhar } = req.body;
    try {
        if(role === 'doctor') {
            const count = await Doctor.countDocuments();
            const doctorId = `DOC-${100 + count + 1}`;
            const newDoc = new Doctor({ doctorId, name: 'Dr. ' + name, specialization, experience: experience || 0, qualifications: qualifications || 'MBBS', contactNumber: contactNumber || 'N/A', address: address || 'N/A', aadhar: aadhar || 'N/A' });
            await newDoc.save();
            res.json({ success: true, user: newDoc });
        } else {
            const count = await Staff.countDocuments({ role });
            const prefix = role.substring(0,3).toUpperCase();
            const staffId = `${prefix}-${100 + count + 1}`;
            const newStaff = new Staff({ staffId, name, role, contactNumber: contactNumber || 'N/A', address: address || 'N/A', aadhar: aadhar || 'N/A' });
            await newStaff.save();
            res.json({ success: true, user: newStaff });
        }
    } catch(err) {
         res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/staff/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if(id.startsWith('DOC')) {
            await Doctor.findOneAndDelete({ doctorId: id });
        } else {
            await Staff.findOneAndDelete({ staffId: id });
        }
        res.json({ success: true });
    } catch(err) {
         res.status(500).json({ error: err.message });
    }
});

app.put('/api/doctors/:id/active', async (req, res) => {
    try {
        const { isActive } = req.body;
        await Doctor.findByIdAndUpdate(req.params.id, { isActive });
        res.json({ success: true });
    } catch(err) {
         res.status(500).json({ error: err.message });
    }
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
