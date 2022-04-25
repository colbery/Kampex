const express = require("express");
const path = require('path');
const mongoose = require("mongoose");
const ejsMate = require('ejs-mate');
const Kampex = require('./models/kampex');


const methodOverride = require("method-override");

mongoose.connect('mongodb://localhost:27017/kampex');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("database connected");
});

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/kampex', async (req, res) => {
    const kampa = await Kampex.find({});
    res.render('kampex/index', { kampa });
});

app.get('/kampex/new', (req, res) => {
    res.render('kampex/new');
});

app.post('/kampex', async (req, res) => {
    const kampex = new Kampex(req.body.kampex);
    await kampex.save();
    res.redirect(`/kampex/${kampex._id}`)
});

app.get('/kampex/:id', async (req, res) => {
    const kampex = await Kampex.findById(req.params.id);
    res.render('kampex/show', { kampex });
});

app.get('/kampex/:id/edit', async (req, res) => {
    const kampex = await Kampex.findById(req.params.id);
    res.render('kampex/edit', { kampex });
});

app.put('/kampex/:id', async (req, res) => {
    const { id } = req.params;
    const kampex = await Kampex.findByIdAndUpdate(id, { ...req.body.kampex });
    res.redirect(`/kampex/${kampex._id}`)
});

app.delete('/kampex/:id', async (req, res) => {
    const { id } = req.params;
    await Kampex.findByIdAndDelete(id);
    res.redirect('/kampex');
});

app.listen(3000, () => {
    console.log('port 3000');
});