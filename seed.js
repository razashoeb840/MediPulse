const Doctor = require('./models/Doctor');
const Bed = require('./models/Bed');
const Medicine = require('./models/Medicine');

async function seed() {
    try {
        // 1. Check for existing doctors to prevent duplicates
        const doctorCount = await Doctor.countDocuments();
        if (doctorCount === 0) {
            await Doctor.insertMany([
                { doctorId: 'DOC-101', name: 'Dr. Rohan Sharma', specialization: 'Cardiology' },
                { doctorId: 'DOC-102', name: 'Dr. Anjali Verma', specialization: 'Neurology' },
                { doctorId: 'DOC-103', name: 'Dr. Prakash Iyer', specialization: 'General Physician' }
            ]);
            console.log('✅ Doctors Seeded');
        }

        // 2. Check for beds - Needs to create all 3 zones for your dashboard
        const bedCount = await Bed.countDocuments();
        if (bedCount === 0) {
            const beds = [];
            // Create 10 ICU Beds
            for(let i=1; i<=10; i++) { 
                beds.push({ bedId: `ICU-${String(i).padStart(2,'0')}`, zone: 'ICU', status: 'free' }); 
            }
            // Create 10 General Beds
            for(let i=1; i<=10; i++) { 
                beds.push({ bedId: `GEN-${String(i).padStart(2,'0')}`, zone: 'General', status: 'free' }); 
            }
            // Create 10 Private Beds
            for(let i=1; i<=10; i++) { 
                beds.push({ bedId: `PVT-${String(i).padStart(2,'0')}`, zone: 'Private', status: 'free' }); 
            }
            
            await Bed.insertMany(beds);
            console.log('✅ 30 Beds Seeded (ICU, General, Private)');
        }

        console.log('✅ Database Initialization Complete');
    } catch (error) { 
        console.error('❌ Seeding failed:', error); 
    }
}
module.exports = seed;