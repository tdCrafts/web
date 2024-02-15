const express = require("express");
const router = express.Router();

const flash = require("express-flash");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const MongoDBStore = require('connect-mongodb-session')(session);
const store = new MongoDBStore({
    uri: process.env.MONGO_URI,
    collection: 'sessions'
});

router.use(cookieParser());
router.use(session({
    resave: false,
    saveUninitialized: true,
    secret: "keyboard cat",
    store,
    cookie: { secure: process.env.DEVELOPMENT !== "true" },
}));
router.use(flash());

const account = require("./account");
router.use("/account", account);

const api = require("./api");
router.use("/api", api);

const calculator = require("./calculator");
router.use("/calculator", calculator);

router.get("/", (req, res) => {
    res.redirect("/calculator/candle");
});

module.exports = router;
