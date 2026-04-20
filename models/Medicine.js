const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
    name: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    price: { type: Number, required: true },
    category: { type: String, default: 'Normal' },
    illness: { type: String, default: 'General' },
    salesPerDay: { type: Number, default: 5 }
});

module.exports = mongoose.model('Medicine', MedicineSchema);
