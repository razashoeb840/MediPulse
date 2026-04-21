const Doctor = require('./models/Doctor');
const Bed = require('./models/Bed');
const Medicine = require('./models/Medicine');

async function seed() {
    try {
        const doctorCount = await Doctor.countDocuments();
        if (doctorCount > 0) return; // Prevent duplicate data

        await Doctor.insertMany([
            { doctorId: 'DOC-101', name: 'Dr. Rohan Sharma', specialization: 'Cardiology' },
            { doctorId: 'DOC-102', name: 'Dr. Anjali Verma', specialization: 'Neurology' },
            { doctorId: 'DOC-103', name: 'Dr. Prakash Iyer', specialization: 'General Physician' }
        ]);

        const beds = [];
        for(let i=1; i<=10; i++) { beds.push({ bedId: `ICU-${String(i).padStart(2,'0')}`, zone: 'ICU', status: 'free' }); }
        await Bed.insertMany(beds);

        console.log('✅ Database Seeded Successfully');
    } catch (error) { console.error('❌ Seeding failed:', error); }
}
module.exports = seed;