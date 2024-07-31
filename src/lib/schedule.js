import cron from "node-cron";
import Transaction from "../models/Transaction.js";
import HotelRoom from "../models/HotelRoom.js";

const updateExpiredTransactions = async () => {
  try {
    const transactions = await Transaction.find({
      checkOutDate: { $lt: new Date() },
      status: {
        $not: {
          $in: ["cancelled", "expired"],
        },
      },
    });

    transactions.forEach(async (transaction) => {
      try {
        await Transaction.findByIdAndUpdate(
          transaction._id,
          {
            $set: {
              status: "expired",
            },
          },
          { new: true }
        );

        const room = await HotelRoom.findById(transaction.room);
        if (room) {
          await HotelRoom.findByIdAndUpdate(
            room._id,
            {
              $set: {
                availability: true,
              },
            },
            { new: true }
          );
        }
      } catch (error) {
        console.error(
          `Error updating transaction ${transaction._id}: ${error}`
        );
      }
    });
  } catch (error) {
    console.error(`Error finding transactions: ${error}`);
  }
};

cron.schedule("*/1 * * * *", updateExpiredTransactions);
