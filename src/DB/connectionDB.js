import mongoose from "mongoose";

const checkConnectionDB = async () => {
  await mongoose
    .connect("mongodb://127.0.0.1:27017/assignment9", {
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
