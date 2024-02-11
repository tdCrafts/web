const mongoose = require("mongoose");

connect().catch(console.error);

async function connect() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB!");
}
