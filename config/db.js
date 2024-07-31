import "dotenv/config";
import mongoose from "mongoose";

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected");
  } catch (err) {
    console.log(err);
  }
})();
