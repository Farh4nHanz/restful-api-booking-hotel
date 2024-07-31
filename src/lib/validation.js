import { check } from "express-validator";
import User from "../models/User.js";
import Hotel from "../models/Hotel.js";
import HotelRoom from "../models/HotelRoom.js";
import mongoose from "mongoose";

export const registerValidator = [
  check("name", "Name is required!").notEmpty(),
  check("username", "Username is required").notEmpty(),
  check("email", "Email is required")
    .notEmpty()
    .isEmail()
    .withMessage("Invalid email!"),
  check("email").custom(async (value) => {
    const user = await User.findOne({ email: value });
    if (user) throw new Error("Email already exist!");
  }),
  check("password", "Password is required!")
    .notEmpty()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters!"),
  check("confirmPassword")
    .notEmpty()
    .withMessage("Please confirm your password!")
    .custom((value, { req }) => {
      if (value !== req.body.password)
        throw new Error("Password does not match!");
      return true;
    }),
];

export const updateUserValidator = [
  check("payment.method", "Invalid payment method!").isIn([
    "credit_card",
    "debit_cart",
    "paypal",
  ]),
  check("payment.cardNumber").custom(async (value, { req }) => {
    const method = req.body.payment.method;
    const card = req.body.payment.cardNumber;
    const cvv = req.body.payment.cvv;
    const expDate = req.body.payment.expiresDate;

    if (method === "credit_card" || method === "debit_card") {
      if (!card) {
        throw new Error("Required card number!");
      } else {
        if (card.toString().length != 16)
          throw new Error("Please enter 16 digits in your card number!");

        if (!cvv) throw new Error("CVV is required!");
        if (cvv.toString().length != 3)
          throw new Error("CVV must be 3 digits!");
        if (!expDate) throw new Error("Expiration date is required!");
      }
    }
  }),
];

export const addRoomValidator = [
  check("hotel").custom(async (value, { req }) => {
    if (!mongoose.isValidObjectId(req.params.id))
      throw new Error("Invalid hotel id!");

    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) throw new Error("Hotel not found!");
  }),
  check("type", "Room type is required!").notEmpty(),
  check("number").custom(async (value, { req }) => {
    const hotelRoom = await HotelRoom.find().where({
      hotel: req.params.id,
      number: value,
    });

    if (hotelRoom.length > 0) {
      const latestRoomNumber = await HotelRoom.findOne({
        hotel: req.params.id,
      })
        .sort({ number: -1 })
        .select("number");

      const suggestedNumber = latestRoomNumber.number + 1;

      throw new Error(
        `Room number ${value} already exist at this hotel. You can use room number ${suggestedNumber} instead.`
      );
    }
  }),
  check("price", "Price is required!").notEmpty(),
  check("amenities", "Please add at least 1 room facility!").notEmpty(),
];
