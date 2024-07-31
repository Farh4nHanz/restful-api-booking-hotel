import mongoose from "mongoose";
import Hotel from "../models/Hotel.js";
import HotelRoom from "../models/HotelRoom.js";
import Path from "../lib/path.js";
import { validationResult } from "express-validator";
import fs from "fs";

export default class HotelRoomController {
  // add hotel's room
  async addRoomsByHotelId(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { type, number, price, amenities } = req.body;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMsg = errors.array().map((error) => error.msg);

        return res.status(400).send({
          success: false,
          errors: {
            error: errorMsg.length,
            msg: errorMsg,
          },
        });
      }

      const findHotel = await Hotel.findById(req.params.id);

      const room = new HotelRoom({
        hotel: req.params.id,
        type,
        number,
        price,
        amenities,
      });

      const newRoom = await room.save({ session });
      findHotel.rooms.push(newRoom.id);
      await findHotel.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(201).send({
        success: true,
        message: "Hotel room added successfully!",
        newRoom: newRoom,
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

  // get hotel room list by hotel id
  async getAllRoomsByHotelId(req, res) {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).send({ message: "Invalid hotel id!" });

    const queryMap = {
      type: (value) => ({
        type: {
          $regex: value,
          $options: "i",
        },
      }),
      price: (value) => ({
        price: { $gte: value },
      }),
    };

    let filter = {};

    Object.keys(req.query).forEach((key) => {
      if (key in queryMap) {
        filter = { ...filter, ...queryMap[key](req.query[key]) };
      }
    });

    try {
      const hotel = await Hotel.findById(req.params.id);
      if (!hotel) return res.status(404).send({ message: "Hotel not found!" });

      const hotelRooms = await HotelRoom.find(filter)
        .where({ hotel: req.params.id })
        .select([
          "image",
          "type",
          "number",
          "amenities",
          "price",
          "availability",
        ])
        .sort({ number: 1 });

      if (hotelRooms.length < 1)
        return res.status(404).send({ message: "No data." });

      const hotelRoomsAvailable = await HotelRoom.find().where({
        hotel: req.params.id,
        availability: true,
      });

      res.status(200).send({
        total: hotelRooms.length,
        roomsAvailable: hotelRoomsAvailable.length,
        rooms: hotelRooms,
      });
    } catch (err) {
      res.status(500).send({
        success: false,
        message: err.message,
      });
    }
  }

  // get hotel room detail by hotel id
  async getRoomById(req, res) {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).send({ message: "Invalid hotel id!" });

    if (!mongoose.isValidObjectId(req.params.roomId))
      return res.status(400).send({ message: "Invalid room id!" });

    try {
      const hotel = await Hotel.findById(req.params.id);
      if (!hotel) return res.status(404).send({ message: "Hotel not found!" });

      const room = await HotelRoom.findById(req.params.roomId).where({
        hotel: req.params.id,
      });

      room
        ? res.status(200).send({ room: room })
        : res.status(404).send({ message: "Room not found!" });
    } catch (err) {
      res.status(500).send({
        success: false,
        error: err.message,
      });
    }
  }

  // upload hotel room images
  async uploadImagesByRoomId(req, res) {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).send({ message: "Invalid hotel id!" });

    if (!mongoose.isValidObjectId(req.params.roomId))
      return res.status(400).send({ message: "Invalid room id!" });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const basePath = Path.getBasePath(req);
      const files = req.files;

      const hotel = await Hotel.findById(req.params.id);
      if (!hotel) {
        files.forEach((file) => fs.unlinkSync(file.path));

        return res.status(404).send({ message: "Hotel not found!" });
      }

      const room = await HotelRoom.findById(req.params.roomId).where({
        hotel: req.params.id,
      });

      if (!room) {
        files.forEach((file) => fs.unlinkSync(file.path));

        return res.status(404).send({ message: "Room not found!" });
      }

      let images = [];

      if (files) {
        files.map((file) => images.push(`${basePath}/${file.filename}`));
      }

      room.image = room.image != "" ? room.image : images[0];
      room.images.push(...images);

      if (room.images.length > 10) {
        files.forEach((file) => fs.unlinkSync(file.path));

        return res.status(400).send({
          success: false,
          message: "Already has 10 images, cannot upload more!",
        });
      }

      await room.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(201).send({
        success: true,
        message: "Room images uploaded successfully!",
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

  // update room by id
  async updateRoomById(req, res) {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).send({ message: "Invalid hotel id!" });

    if (!mongoose.isValidObjectId(req.params.roomId))
      return res.status(400).send({ message: "Invalid room id!" });

    try {
      const hotel = await Hotel.findById(req.params.id);
      if (!hotel) return res.status(404).send({ message: "Hotel not found!" });

      const room = await HotelRoom.findById(req.params.roomId).where({
        hotel: req.params.id,
      });

      if (!room) return res.status(404).send({ message: "Room not found!" });

      const roomExist = await HotelRoom.findOne({
        hotel: req.params.id,
        number: req.body.number,
        _id: { $ne: req.params.roomId },
      });

      if (roomExist) {
        const latestRoomNumber = await HotelRoom.findOne({
          hotel: req.params.id,
        })
          .sort({ number: -1 })
          .select("number");

        const suggestedNumber = latestRoomNumber.number + 1;

        return res.status(400).send({
          message: `Room number ${req.body.number} already exist at this hotel. You can use room number ${suggestedNumber} instead.`,
        });
      }

      const updatedRoom = await HotelRoom.findByIdAndUpdate(
        req.params.roomId,
        {
          $set: req.body,
          updatedAt: Date.now(),
        },
        { new: true }
      );

      await Hotel.findByIdAndUpdate(req.params.id, {
        updatedAt: Date.now(),
      });

      res.status(201).send({
        success: true,
        message: "Room updated successfully!",
        updatedRoom: updatedRoom,
      });
    } catch (err) {
      res.status(500).send({
        success: false,
        error: err.message,
      });
    }
  }

  // delete room images by index
  async deleteRoomImagesByIndex(req, res) {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).send({ message: "Invalid hotel id!" });

    if (!mongoose.isValidObjectId(req.params.roomId))
      return res.status(400).send({ message: "Room not found!" });

    try {
      const hotel = await Hotel.findById(req.params.id);
      if (!hotel) return res.status(404).send({ message: "Hotel not found!" });

      const room = await HotelRoom.findById(req.params.roomId).where({
        hotel: req.params.id,
      });

      if (!room) return res.status(404).send({ message: "Room not found!" });

      const index = parseInt(req.params.index);
      if (isNaN(index) || index < 1)
        return res.status(400).send({ message: "Invalid index!" });

      const images = room.images;
      if (index > images.length)
        return res.status(404).send({ message: "Image not found!" });

      await HotelRoom.updateOne(
        { _id: req.params.roomId },
        {
          $pull: {
            images: {
              $eq: images[index - 1],
            },
          },
          updatedAt: Date.now(),
        }
      ).where({ hotel: req.params.id });

      if (room.image === images[index - 1]) {
        room.image = "";
      }

      await room.save();

      images.forEach((image) => Path.unlinkImagePath(image));

      res.status(200).send({
        success: true,
        message: "Image deleted successfully!",
      });
    } catch (err) {
      res.status(500).send({
        success: false,
        error: err.message,
      });
    }
  }

  // delete room by id by hotel id
  async deleteRoomById(req, res) {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).send({ message: "Invalid hotel id!" });

    if (!mongoose.isValidObjectId(req.params.roomId))
      return res.status(400).send({ message: "Invalid room id!" });

    try {
      const hotel = await Hotel.findById(req.params.id);
      if (!hotel) return res.status(404).send({ message: "Hotel not found!" });

      const room = await HotelRoom.findByIdAndDelete(req.params.roomId).where({
        hotel: req.params.id,
      });

      if (!room) return res.status(404).send({ message: "Room not found!" });

      const images = room.images;
      images.forEach((image) => Path.unlinkImagePath(image));

      await Hotel.findByIdAndUpdate(req.params.id, {
        $pull: {
          rooms: req.params.roomId,
        },
        updatedAt: Date.now(),
      });

      await hotel.save();

      res.status(200).send({
        success: true,
        message: "One room at this hotel has been deleted!",
      });
    } catch (err) {
      res.status(500).send({
        success: false,
        error: err.message,
      });
    }
  }

  // delete all rooms by hotel id
  async deleteAllRoomsByHotelId(req, res) {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).send({ message: "Invalid hotel id!" });

    try {
      const hotel = await Hotel.findById(req.params.id);
      if (!hotel) return res.status(404).send({ message: "Hotel not found!" });

      const rooms = await HotelRoom.find().where({ hotel: req.params.id });
      if (rooms.length < 1)
        return res.status(404).send({
          message: "There is no room at this hotel!",
        });

      await HotelRoom.deleteMany().where({ hotel: req.params.id });
      await Hotel.findByIdAndUpdate(req.params.id, {
        $set: {
          rooms: [],
        },
      });

      rooms.forEach((room) => {
        const images = room.images;
        images.forEach((image) => Path.unlinkImagePath(image));
      });

      res.status(200).send({
        success: true,
        message: "All rooms at this hotel successfully deleted!",
      });
    } catch (err) {
      res.status(500).send({
        success: false,
        error: err.message,
      });
    }
  }
}
