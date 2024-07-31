import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import Hotel from "../models/Hotel.js";
import HotelRoom from "../models/HotelRoom.js";

export default class TransactionController {
  // get all transaction
  async getAllTransaction(req, res) {
    try {
      if (!req.user.isAdmin) {
        const transaction = await Transaction.find()
          .select(["user", "hotel", "room", "checkInDate", "status"])
          .where({ user: req.user.id });

        if (transaction.length < 1)
          return res.status(404).send({ message: "No transaction data." });

        res.status(200).send({
          total: transaction.length,
          transaction: transaction,
        });
      } else {
        const transaction = await Transaction.find().select([
          "user",
          "hotel",
          "room",
          "checkInDate",
          "status",
        ]);

        if (transaction.length < 1)
          return res.status(404).send({ message: "No transaction data." });

        res.status(200).send({
          total: transaction.length,
          transaction: transaction,
        });
      }
    } catch (err) {
      res.status(500).send({
        success: false,
        error: err.message,
      });
    }
  }

  // get transaction detail by id
  async getTransactionDetail(req, res) {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).send({ message: "Invalid transaction id!" });

    try {
      if (!req.user.isAdmin) {
        const transaction = await Transaction.findById(req.params.id)
          .where({ user: req.user.id })
          .populate("user", "name")
          .populate("hotel", "name")
          .populate("room", "hotel number");

        transaction
          ? res.status(200).send({ transaction: transaction })
          : res.status(404).send({ message: "Transaction not found!" });
      } else {
        const transaction = await Transaction.findById(req.params.id)
          .populate("user", "name")
          .populate("hotel", "name")
          .populate("room", "hotel number");

        transaction
          ? res.status(200).send({ transaction: transaction })
          : res.status(404).send({ message: "Transaction not found!" });
      }
    } catch (err) {
      res.status(500).send({
        success: false,
        error: err.message,
      });
    }
  }

  // add new transaction
  async bookingAHotel(req, res) {
    if (!mongoose.isValidObjectId(req.params.hotelId))
      return res.status(400).send({ message: "Invalid hotel id!" });

    if (!mongoose.isValidObjectId(req.params.roomId))
      return res.status(400).send({ message: "Invalid room id!" });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const hotel = await Hotel.findById(req.params.hotelId);
      if (!hotel) return res.status(404).send({ message: "Hotel not found!" });

      const room = await HotelRoom.findById(req.params.roomId).where({
        hotel: req.params.hotelId,
      });
      if (!room) return res.status(404).send({ message: "Room not found!" });
      if (!room.availability)
        return res.status(400).send({ message: "This room is not available!" });

      const checkInDate = new Date(req.body.checkInDate);
      const checkOutDate = new Date(req.body.checkOutDate);
      const numberOfNights = Math.round(
        (checkOutDate - checkInDate) / (1000 * 3600 * 24)
      );
      const roomPrice = room.price;
      const amount = roomPrice * numberOfNights;

      const transaction = new Transaction({
        user: req.user.id,
        hotel: req.params.hotelId,
        room: req.params.roomId,
        checkInDate,
        checkOutDate,
        payment: {
          amount,
          method: req.body.payment.method,
        },
      });

      const newTransaction = await transaction.save({ session });

      await HotelRoom.findByIdAndUpdate(req.params.roomId, {
        $set: { availability: false },
        updatedAt: Date.now(),
      }).where({ hotel: req.params.hotelId });

      await room.save({ session });
      await hotel.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(201).send({
        success: true,
        message: "This hotel room was successfully booked!",
        transaction: newTransaction,
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();

      res.status(500).send({
        success: false,
        error: err.message,
      });
    }
  }

  // cancel booking
  async cancelBooking(req, res) {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).send({ message: "Invalid order id!" });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (!req.user.isAdmin) {
        const order = await Transaction.findById(req.params.id).where({
          user: req.user.id,
        });

        if (!order)
          return res.status(404).send({ message: "Order not found!" });

        switch (order.status) {
          case "cancelled":
            return res.status(400).send({ message: "Already cancelled." });

          case "expired":
            return res.status(400).send({ message: "Already expired." });
        }

        await Transaction.updateOne(
          { _id: req.params.id },
          {
            $set: {
              status: "cancelled",
            },
          }
        ).where({ user: req.user.id });

        await order.save({ session });

        await HotelRoom.updateOne(
          {
            _id: order.room,
          },
          {
            $set: {
              availability: true,
            },
            updatedAt: Date.now(),
          },
          { new: true }
        );

        await session.commitTransaction();
        session.endSession();

        res.status(200).send({
          success: true,
          message: "Booking cancelled!",
        });
      } else {
        const order = await Transaction.findById(req.params.id);

        if (!order)
          return res.status(404).send({ message: "Order not found!" });

        switch (order.status) {
          case "cancelled":
            return res.status(400).send({ message: "Already cancelled." });

          case "expired":
            return res.status(400).send({ message: "Already expired." });
        }

        await Transaction.updateOne(
          { _id: req.params.id },
          {
            $set: {
              status: "cancelled",
            },
          }
        );

        await order.save({ session });

        await HotelRoom.updateOne(
          {
            _id: order.room,
          },
          {
            $set: {
              availability: true,
            },
            updatedAt: Date.now(),
          },
          { new: true }
        );

        await session.commitTransaction();
        session.endSession();

        res.status(200).send({
          success: true,
          message: "Booking cancelled!",
        });
      }
    } catch (err) {
      await session.abortTransaction();
      session.endSession();

      res.status(500).send({
        success: false,
        error: err.message,
      });
    }
  }

  // delete transaction by id
  async deleteTransactionById(req, res) {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).send({ message: "Invalid transaction id!" });

    try {
      if (!req.user.isAdmin) {
        const transaction = await Transaction.findByIdAndDelete(
          req.params.id
        ).where({
          user: req.user.id,
          status: {
            $in: ["expired", "cancelled"],
          },
        });

        transaction
          ? res.status(200).send({
              success: true,
              message: "Transaction deleted!",
            })
          : res.status(404).send({
              success: false,
              message: "Transaction not found!",
            });
      } else {
        const transaction = await Transaction.findByIdAndDelete(
          req.params.id
        ).where({
          status: {
            $in: ["expired", "cancelled"],
          },
        });

        transaction
          ? res.status(200).send({
              success: true,
              message: "Transaction deleted!",
            })
          : res.status(404).send({
              success: false,
              message: "Transaction not found!",
            });
      }
    } catch (err) {
      res.status(500).send({
        success: false,
        error: err.message,
      });
    }
  }
}
