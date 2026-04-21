const Bed = require('./models/Bed');
const Doctor = require('./models/Doctor');

async function seed() {
    try {
        const bedCount = await Bed.countDocuments();
        // If there aren't 30 beds, we add the missing ones
        if (bedCount < 30) {
            // Clear existing beds to avoid duplicates during this fix
            await Bed.deleteMany({}); 
            
            const beds = [];
            for(let i=1; i<=10; i++) beds.push({ bedId: `ICU-${i}`, zone: 'ICU', status: 'free' });
            for(let i=1; i<=10; i++) beds.push({ bedId: `GEN-${i}`, zone: 'General', status: 'free' });
            for(let i=1; i<=10; i++) beds.push({ bedId: `PVT-${i}`, zone: 'Private', status: 'free' });
            
            await Bed.insertMany(beds);
            console.log('✅ 30 Beds Created: ICU, General, and Private');
        }
    } catch (error) {
        console.error('❌ Seed Error:', error);
    }
}
module.exports = seed;