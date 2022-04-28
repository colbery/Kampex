const express = require("express");
const path = require('path');
const mongoose = require("mongoose");
const ejsMate = require('ejs-mate');
const catchAsync = require('./helper/catchAsync');
const ExpressError = require('./helper/ExpressError');
const Kampex = require('./models/kampex');
const Review = require('./models/review');


const methodOverride = require("method-override");
const kampex = require("./models/kampex");

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

app.get('/kampex', catchAsync(async (req, res) => {
    const kampa = await Kampex.find({});
    res.render('kampex/index', { kampa });
}));

app.get('/kampex/new', (req, res) => {
    res.render('kampex/new');
});

app.post('/kampex', catchAsync(async (req, res, next) => {
    if (!req.body.kampex) throw new ExpressError("Bledne dane", 400);
    const kampex = new Kampex(req.body.kampex);
    await kampex.save();
    res.redirect(`/kampex/${kampex._id}`)

}));

app.get('/kampex/:id', catchAsync(async (req, res) => {
    const kampex = await Kampex.findById(req.params.id);
    res.render('kampex/show', { kampex });
}));

app.get('/kampex/:id/edit', catchAsync(async (req, res) => {
    const kampex = await Kampex.findById(req.params.id);
    res.render('kampex/edit', { kampex });
}));

app.put('/kampex/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    const kampex = await Kampex.findByIdAndUpdate(id, { ...req.body.kampex });
    res.redirect(`/kampex/${kampex._id}`)
}));

app.delete('/kampex/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    await Kampex.findByIdAndDelete(id);
    res.redirect('/kampex');
}));

app.post('/kampex/:id/reviews', catchAsync(async (req, res) => {
    const kampex = await Kampex.findById(req.params.id);
    const review = new Review(req.body.review);
    kampex.reviews.push(review);
    await review.save();
    await kampex.save();
    res.redirect(`/kampex/${kampex._id}`);
}));

app.all('*', (req, res, next) => {
    next(new ExpressError('Nie ma strony', 404))
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Coś poszło nie tak";
    res.status(statusCode).render('error', { err });

});

app.listen(3000, () => {
    console.log('port 3000');
});