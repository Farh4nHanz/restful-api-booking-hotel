import express from "express";
import TransactionController from "../controllers/transactionController.js";
import { isAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();
const transaction = new TransactionController();

router
  .get("/history", isAuth, transaction.getAllTransaction)
  .get("/history/:id", isAuth, transaction.getTransactionDetail);

router.post(
  "/hotels/:hotelId/rooms/:roomId",
  isAuth,
  transaction.bookingAHotel
);

router.put("/order/:id", isAuth, transaction.cancelBooking);

router.delete("/history/:id", isAuth, transaction.deleteTransactionById);

export default router;
