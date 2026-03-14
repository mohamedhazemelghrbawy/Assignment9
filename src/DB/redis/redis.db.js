import { createClient } from "redis";

export const redisClient = createClient({
  url: "rediss://default:gQAAAAAAAQzPAAIncDI3ZGQzNjI0MDRkODM0MWRmOGNlODMwNTg4YTgzNjFjMHAyNjg4MTU@mighty-bird-68815.upstash.io:6379",
});

export const redisConnection = async () => {
  try {
    await redisClient.connect();
    console.log("success to connect with redis");
  } catch (error) {
    console.log("Fail to connect with redis", error);
  }
};
