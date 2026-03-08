import express from "express";
import checkConnectionDB from "./DB/connectionDB.js";
import userRouter from "./modules/users/user.controller.js";
import cors from "cors";
import { PORT } from "../config/config.service.js";
const app = express();
const port = PORT;

const bootstrap = () => {
  app.use(cors(), express.json());
  app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcom on my App" });
  });
  app.use("/uploads", express.static("uploads"));
  app.use("/users", userRouter);
  app.use("{*demo}", (req, res) => {
    throw new Error(`Url ${req.originalUrl} Not found`, { cause: 404 });
  });
  checkConnectionDB();
  app.use((err, req, res, next) => {
    console.log(err.stack);
    res
      .status(err.cause || 500)
      .json({ message: err.message, stack: err.stack });
  });
  app.listen(port, () => {
    console.log(`server running on port ${port}`);
  });
};
export default bootstrap;
