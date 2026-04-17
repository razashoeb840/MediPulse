const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
    token: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    contact: { type: String, required: false },
    address: { type: String, default: 'N/A' },
    aadhar: { type: String, default: 'N/A' },
    problem: { type: String, required: true },
    assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    status: { type: String, enum: ['waiting', 'prescribed', 'completed'], default: 'waiting' },
    createdAt: { type: Date, default: Date.now },
    consultedAt: { type: Date },
    completedAt: { type: Date },
    paymentStatus: { type: String, default: 'Pending' }
});

module.exports = mongoose.model('Patient', PatientSchema);
