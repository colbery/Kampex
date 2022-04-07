const mongoose = require("mongoose");
const cities = require('./cities');
const Kampex = require('../models/kampex');

mongoose.connect('mongodb://localhost:27017/kampex');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("database connected");
});


const seedDB = async () => {
    await Kampex.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const random439 = Math.floor(Math.random() * 439);
        const camp = new Kampex({
            location: `${cities[random439].name}`
        })
        await camp.save();

    }
}

seedDB();