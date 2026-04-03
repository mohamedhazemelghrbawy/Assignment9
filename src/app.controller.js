import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import checkConnectionDB from "./DB/connectionDB.js";
import userRouter from "./modules/users/user.controller.js";
import { PORT, WHITE_LIST } from "../config/config.service.js";
import { redisConnection } from "./DB/redis/redis.db.js";
import messageRouter from "./modules/message/message.controller.js";

const app = express();
const port = PORT;

const bootstrap = () => {
  const limiter = rateLimit({
    windowMs: 60 * 5 * 1000,
    limit: 10,
    // message:""
  });

  const crosOrigin = {
    origin: function (origin, callback) {
      if ([...WHITE_LIST, undefined].includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("you donot allowed"));
      }
    },
  };
  app.use(cors(crosOrigin), helmet(), limiter, express.json());
  app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcom on my App" });
  });
  app.use("/uploads", express.static("uploads"));
  app.use("/users", userRouter);
  app.use("/messages", messageRouter);

  app.use("{*demo}", (req, res) => {
    throw new Error(`Url ${req.originalUrl} Not found`, { cause: 404 });
  });
  checkConnectionDB();
  redisConnection();
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
