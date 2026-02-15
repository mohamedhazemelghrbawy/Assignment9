import express from "express";
import checkConnectionDB from "./DB/connectionDB.js";
import userRouter from "./modules/users/user.controller.js";
const app = express();
const port = 3000;

const bootstrap = () => {
  app.use(express.json());
  app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcom on my App" });
  });
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
    console.log("server running");
  });
};
export default bootstrap;
