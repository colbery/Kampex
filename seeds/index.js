const mongoose = require("mongoose");
const cities = require('./cities');
const { places, descriptors } = require('./seedHelp');
const Kampex = require('../models/kampex');

mongoose.connect('mongodb://localhost:27017/kampex');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("database connected");
});

const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    await Kampex.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const random439 = Math.floor(Math.random() * 439);
        const price = Math.floor(Math.random() * 30) + 10;
        const camp = new Kampex({
            location: `${cities[random439].name}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            image: 'https://source.unsplash.com/collection/483251',
            description: "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Omnis, ullam cumque? Consectetur, esse numquam eius eos rem doloremque omnis ex aliquam ducimus eaque asperiores? Dolores officia itaque amet animi vero.",
            price
        })
        await camp.save();

    }
}

seedDB().then(() => {
    mongoose.connection.close();
})