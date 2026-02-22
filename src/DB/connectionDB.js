import mongoose from "mongoose";
import { DB_URI } from "../../config/config.service.js";

const checkConnectionDB = async () => {
  await mongoose
    .connect(DB_URI, {
      serverSelectionTimeoutMS: 3000,
    })
    .then(() => {
      console.log("DB connection successfully");
    })
    .catch((error) => {
      console.log(error, "DB connection faild");
    });
};
export default checkConnectionDB;
