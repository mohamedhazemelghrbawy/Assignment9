import cron from "node-cron";
import userModel from "../DB/models/user.model.js"; // عدل المسار حسب مشروعك

// كل ساعة يشوف اليوزرز اللي مش confirmed ومضى عليهم يوم
cron.schedule("0 * * * *", async () => {
  const oneDayAgo = new Date(Date.now() - 60);

  const deleted = await userModel.deleteMany({
    createdAt: { $lt: oneDayAgo },
  });

  console.log(`Deleted ${deleted.deletedCount} unconfirmed users`);
});
