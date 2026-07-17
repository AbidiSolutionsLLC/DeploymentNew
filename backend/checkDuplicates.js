const mongoose = require('mongoose');
const User = require('./models/userSchema');
const TimeTracker = require('./models/timeTrackerSchema');

const uri = "mongodb://abidi_pro:5DtJcxVMpQu1z2DY@ac-86jd9op-shard-00-00.v2scegv.mongodb.net:27017,ac-86jd9op-shard-00-01.v2scegv.mongodb.net:27017,ac-86jd9op-shard-00-02.v2scegv.mongodb.net:27017/?ssl=true&replicaSet=atlas-kvo9b7-shard-0&authSource=admin&appName=Cluster0";

async function main() {
    await mongoose.connect(uri);
    console.log("Connected to DB");
    
    const logs = await TimeTracker.find({}).populate('user', 'name');
    console.log(`Found ${logs.length} logs total.`);
    
    let userDateMap = {};
    for (let log of logs) {
        if (!log.user) continue;
        const userId = log.user._id.toString();
        const userName = log.user.name;
        const dateStr = log.date.toISOString().split('T')[0];
        
        const key = `${userId}_${dateStr}`;
        if (!userDateMap[key]) {
            userDateMap[key] = {
                userName,
                date: dateStr,
                logs: []
            };
        }
        userDateMap[key].logs.push(log);
    }
    
    let foundDuplicates = false;
    for (let key in userDateMap) {
        if (userDateMap[key].logs.length > 1) {
            foundDuplicates = true;
            console.log(`\n🚨 DUPLICATE FOUND for user: ${userDateMap[key].userName} on date: ${userDateMap[key].date}`);
            userDateMap[key].logs.forEach(l => {
                console.log(` - ID: ${l._id}, CheckIn: ${l.checkInTime}, CheckOut: ${l.checkOutTime}, Hours: ${l.totalHours}, Status: ${l.status}, AutoCheckedOut: ${l.autoCheckedOut}`);
            });
        }
    }
    
    await mongoose.disconnect();
}

main().catch(console.error);
