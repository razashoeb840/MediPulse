const mongoose = require('mongoose');

const BedSchema = new mongoose.Schema({
  bedId: { type: String, required: true }, // e.g. ICU-01
  zone: { type: String, enum: ['ICU', 'General', 'Private'], required: true },
  status: { type: String, enum: ['free', 'occ', 'emg'], default: 'free' },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', default: null }
});

module.exports = mongoose.model('Bed', BedSchema);
