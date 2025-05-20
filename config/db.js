const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = async (req, res) => {
    try {

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("mongoDB connected");

    } catch (error) {

        console.log("DB connection error", error.message);
        process.exit();

    }
}


module.exports = connectDB