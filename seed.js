const Doctor = require('./models/Doctor');
const Bed = require('./models/Bed');
const Medicine = require('./models/Medicine');
const Staff = require('./models/Staff');

async function seed() {
    try {
        console.log('--- Starting Seeding Process ---');

        // 1. Check if data already exists to avoid duplicates
        // This prevents the code from adding the same doctors every time the server restarts
        const doctorCount = await Doctor.countDocuments();
        if (doctorCount > 0) {
            console.log('Data already exists in Atlas. Skipping seeding.');
            return; 
        }

        console.log('No data found in Atlas. Seeding initial data...');

        // 2. Seed Doctors
        const doctors = [
            { doctorId: 'DOC-101', name: 'Dr. Rohan Sharma', specialization: 'Cardiology' },
            { doctorId: 'DOC-102', name: 'Dr. Anjali Verma', specialization: 'Neurology' },
            { doctorId: 'DOC-103', name: 'Dr. Prakash Iyer', specialization: 'General Physician' }
        ];
        await Doctor.insertMany(doctors);
        console.log('✅ Doctors seeded.');

        // 3. Seed Staff
        const staffList = [
            { staffId: 'ADM-001', name: 'Ravi Kumar', role: 'admin' },
            { staffId: 'REC-001', name: 'Priya Desai', role: 'receptionist' },
            { staffId: 'PHA-001', name: 'Vikram Singh', role: 'pharmacy' }
        ];
        await Staff.insertMany(staffList);
        console.log('✅ Staff seeded.');

        // 4. Seed Individual Beds
        const beds = [];
        // 10 ICU Beds
        for(let i=1; i<=10; i++) { 
            beds.push({ bedId: `ICU-${String(i).padStart(2,'0')}`, zone: 'ICU', status: 'free' }); 
        }
        // 50 General Beds
        for(let i=1; i<=50; i++) { 
            beds.push({ bedId: `GW-${String(i).padStart(2,'0')}`, zone: 'General', status: 'free' }); 
        }
        // 15 Private Beds
        for(let i=1; i<=15; i++) { 
            beds.push({ bedId: `PR-${String(i).padStart(2,'0')}`, zone: 'Private', status: 'free' }); 
        }
        await Bed.insertMany(beds);
        console.log(`✅ 75 Individual Beds seeded.`);

        // 5. Seed Medicines
        const medicines = [
            { name: 'Paracetamol', stock: 100, price: 10 },
            { name: 'Amoxicillin', stock: 50, price: 50 },
            { name: 'Cetirizine', stock: 200, price: 5 },
            { name: 'Ibuprofen', stock: 150, price: 15 },
            { name: 'Cough Syrup', stock: 60, price: 80 }
        ];
        await Medicine.insertMany(medicines);
        console.log('✅ Medicines seeded.');

        console.log('--- Seeding completed successfully! ---');
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        // We do not use process.exit(1) here so Render doesn't kill the server
    }
}

module.exports = seed;