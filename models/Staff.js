const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
    staffId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'receptionist', 'pharmacy'] },
    contactNumber: { type: String, default: 'N/A' },
    address: { type: String, default: 'N/A' },
    aadhar: { type: String, default: 'N/A' },
    addedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Staff', StaffSchema);
