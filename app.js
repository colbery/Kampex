const express = require("express");
const path = require('path');
const mongoose = require("mongoose");
const Kampex = require('./models/kampex');

mongoose.connect('mongodb://localhost:27017/kampex');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("database connected");
});

const app = express();


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.render('home');
})

app.get('/makekampex', async (req, res) => {
    const camp = new Kampex({ title: 'Dom', description: 'Tanio' });
    await camp.save();
    res.send(camp);
})


app.listen(3000, () => {
    console.log('port 3000');
})