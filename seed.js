const Doctor = require('./models/Doctor');
const Bed = require('./models/Bed');
const Staff = require('./models/Staff');

async function seed() {
    try {
        const bedCount = await Bed.countDocuments();
        if (bedCount === 0) {
            const beds = [];
            // Create 10 ICU Beds
            for(let i=1; i<=10; i++) beds.push({ bedId: `ICU-${i}`, zone: 'ICU', status: 'free' });
            // Create 10 General Beds
            for(let i=1; i<=10; i++) beds.push({ bedId: `GEN-${i}`, zone: 'General', status: 'free' });
            // Create 10 Private Beds
            for(let i=1; i<=10; i++) beds.push({ bedId: `PVT-${i}`, zone: 'Private', status: 'free' });
            
            await Bed.insertMany(beds);
            console.log('✅ 30 Beds (ICU, General, Private) Seeded Successfully');
        }
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    }
}
module.exports = seed;