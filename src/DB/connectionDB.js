import mongoose from "mongoose";
import { DB_URI_ONLINE } from "../../config/config.service.js";

const checkConnectionDB = async () => {
  await mongoose
    .connect(DB_URI_ONLINE, {
      serverSelectionTimeoutMS: 3000,
    })
    .then(() => {
      console.log(`DB connection successfully on ${DB_URI_ONLINE}`);
    })
    .catch((error) => {
      console.log(error, "DB connection faild");
    });
};
export default checkConnectionDB;
