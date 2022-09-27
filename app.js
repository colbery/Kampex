if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const catchAsync = require("./helper/catchAsync");
const ExpressBlad = require("./helper/ExpressBlad");
const Kampex = require("./models/kampex");
const Review = require("./models/review");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const { isLoggedIn } = require("./middleware");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken =
  "pk.eyJ1Ijoic3Rhcm1hdCIsImEiOiJjbDJubjkwNWUxd21vM2dvN3Q2aXljOGE5In0.n2FoT-jgvQ_LX6gq0B1OUg";
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const userRoutes = require("./routes/users");
const methodOverride = require("method-override");
const MongoStore = require("connect-mongo");
const multer = require("multer");
const { storage } = require("./cloudinary");
const upload = multer({ storage });

const kampex = require("./models/kampex");
const Joi = require("joi");

const dbURL = process.env.DB_URL || "mongodb://localhost:27017/kampex";

mongoose.connect(dbURL);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("database connected");
});

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

const secret = process.env.SECRET || "secret";
const store = MongoStore.create({
  mongoUrl: dbURL,
  touchAfter: 24 * 60 * 60,
  crypto: {
    secret,
  },
});

const sessionConfig = {
  store,
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    //tydzien od teraz
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use("/", userRoutes);

app.get("/", (req, res) => {
  res.render("home");
});

app.get(
  "/kampex",
  catchAsync(async (req, res) => {
    const kampa = await Kampex.find({});
    res.render("kampex/index", { kampa });
  })
);

app.get("/kampex/new", isLoggedIn, (req, res) => {
  res.render("kampex/new");
});

app.post(
  "/kampex",

  isLoggedIn,
  upload.array("image"),
  catchAsync(async (req, res, next) => {
    const geoData = await geocoder
      .forwardGeocode({
        query: req.body.kampex.location,
        limit: 1,
      })
      .send();

    //if (!req.body.kampex) throw new ExpressError("Bledne dane", 400);
    // const kampexSchema = Joi.object({
    //   kampex: Joi.object({
    //     title: Joi.string().required().escapeHTML(),
    //     price: Joi.number().required().min(0),
    //     location: Joi.string().required().escapeHTML(),
    //     description: Joi.string().required().escapeHTML(),
    //   }).required(),
    // });
    // const { error } = kampexSchema.validate(req.body);
    // if (error) {
    //   const msg = error.details.map((el) => el.message).join(",");
    //   throw new ExpressError(msg, 400);
    // }
    const kampex = new Kampex(req.body.kampex);
    kampex.images = req.files.map((f) => ({
      url: f.path,
      filename: f.filename,
    }));

    kampex.geometry = geoData.body.features[0].geometry;
    kampex.author = req.user._id;
    await kampex.save();
    req.flash("success", "Udało się stworzyć nowy Kampex!");

    res.redirect(`/kampex/${kampex._id}`);
  })
);

app.get(
  "/kampex/:id",
  catchAsync(async (req, res) => {
    const kampex = await Kampex.findById(req.params.id)
      .populate({ path: "reviews", populate: { path: "author" } })
      .populate("author");
    console.log(kampex);
    if (!kampex) {
      req.flash("error", "Nie ma takiego Kampex-a!");
      return res.redirect("/kampex");
    }
    //console.log(kampex);
    res.render("kampex/show", { kampex });
  })
);

app.get(
  "/kampex/:id/edit",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const kampex = await Kampex.findById(req.params.id);
    if (!kampex) {
      req.flash("error", "Nie ma takiego Kampex-a!");
      return res.redirect("/kampex");
    }
    res.render("kampex/edit", { kampex });
  })
);

app.put(
  "/kampex/:id",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const kampex = await Kampex.findByIdAndUpdate(id, { ...req.body.kampex });
    req.flash("success", "Udało się uaktualnić dany Kampex!");
    res.redirect(`/kampex/${kampex._id}`);
  })
);

app.delete(
  "/kampex/:id",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    await Kampex.findByIdAndDelete(id);
    req.flash("success", "Udało się usunąć dany Kampex!");

    res.redirect("/kampex");
  })
);

app.post(
  "/kampex/:id/reviews",
  catchAsync(async (req, res) => {
    const kampex = await Kampex.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    kampex.reviews.push(review);
    await review.save();
    await kampex.save();
    req.flash("success", "Udało się stworzyć nową opinie!");
    res.redirect(`/kampex/${kampex._id}`);
  })
);

app.delete(
  "/kampex/:id/reviews/:reviewId",
  catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    //puluje id z reviews a reviews to jest array
    await Kampex.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Udało się usunąć opinie!");
    res.redirect(`/kampex/${id}`);
  })
);
app.all("*", (req, res, next) => {
  next(new ExpressBlad("Nie ma strony", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Coś poszło nie tak";
  res.status(statusCode).render("error", { err });
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`port ${port}`);
});
