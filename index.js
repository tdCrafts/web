require("dotenv").config();
require("./database");

const express = require("express");
const app = express();

const bodyParser = require("body-parser");

app.set("view engine", "ejs");

app.use(express.static("static"))

app.use(bodyParser.json());

const controller = require("./controllers");
app.use("/", controller);

app.listen(process.env.EXPRESS_PORT, () => {
    console.log(`Express is listening on port ${process.env.EXPRESS_PORT}`);
});
