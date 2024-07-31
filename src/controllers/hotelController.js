import mongoose from "mongoose";
import Hotel from "../models/Hotel.js";
import HotelRoom from "../models/HotelRoom.js";
import Path from "../lib/path.js";
import fs from "fs";

export default class HotelController {
  // add new hotel
  async addHotel(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { hotelData, roomsData } = req.body;

      // add hotel
      const hotel = new Hotel(hotelData);
      const newHotel = await hotel.save({ session });

      // add rooms
      const rooms = roomsData.map((room) => ({
        hotel: newHotel.id,
        ...room,
      }));

      const newRooms = await HotelRoom.insertMany(rooms, { session });

      // update the hotel rooms with room references
      newHotel.rooms = newRooms.map((room) => room.id);
      await newHotel.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(201).send({
        success: true,
        message: "Hotel successfully added!",
        hotel: newHotel,
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

  // get all hotels
  async getAllHotels(req, res) {
    const queryMap = {
      name: (value) => ({
        name: {
          $regex: value,
          $options: "i",
        },
      }),
      country: (value) => ({
        "location.country": {
          $regex: value,
          $options: "i",
        },
      }),
      city: (value) => ({
        "location.city": {
          $regex: value,
          $options: "i",
        },
      }),
      rating: (value) => ({
        rating: {
          $gte: value,
        },
      }),
    };

    let filter = {};

    Object.keys(req.query).forEach((key) => {
      if (key in queryMap) {
        filter = { ...filter, ...queryMap[key](req.query[key]) };
      }
    });

    try {
      const hotels = await Hotel.find(filter).select([
        "name",
        "image",
        "description",
        "location",
        "rooms",
        "priceRange",
        "rating",
      ]);

      if (hotels.length < 1)
        return res.status(404).send({ message: "There's no hotels data!" });

      res.status(200).send({
        count: hotels.length,
        hotels: hotels,
      });
    } catch (err) {
      res.status(500).send({
        success: false,
        error: err.message,
      });
    }
  }

  // get hotel by id
  async getHotelById(req, res) {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).send({ message: "Invalid hotel id!" });

    try {
      const hotel = await Hotel.findById(req.params.id).populate({
        path: "rooms",
        select: ["type", "number", "amenities", "price", "availability"],
      });

      hotel
        ? res.status(200).send({ hotel: hotel })
        : res.status(404).send({
            success: false,
            message: "Hotel not found!",
          });
    } catch (err) {
      res.status(500).send({
        success: false,
        error: err.message,
      });
    }
  }

  // upload hotel images
  async uploadHotelImagesByHotelId(req, res) {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).send({ message: "Invalid hotel id!" });

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

      let images = [];

      if (files) {
        files.map((file) => images.push(`${basePath}/${file.filename}`));
      }

      hotel.image = hotel.image != "" ? hotel.image : images[0];
      hotel.images.push(...images);

      if (hotel.images.length > 10) {
        files.forEach((file) => fs.unlinkSync(file.path));

        return res.status(400).send({
          success: false,
          message: "Already has 10 images, cannot upload more!",
        });
      }

      await hotel.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(201).send({
        success: true,
        message: "Hotel images uploaded successfully!",
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

  // update hotel by id
  async updateHotelById(req, res) {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).send({ message: "Invalid hotel id!" });

    try {
      const hotel = await Hotel.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body,
          updatedAt: Date.now(),
        },
        { new: true }
      );

      if (!hotel) return res.status(404).send({ message: "Hotel not found!" });

      const updatedHotel = await hotel.save();

      res.status(201).send({
        success: true,
        message: "Hotel updated successfully!",
        updatedHotel: updatedHotel,
      });
    } catch (err) {
      res.status(500).send({
        success: false,
        error: err.message,
      });
    }
  }

  // delete hotel image by index
  async deleteHotelImagesByIndex(req, res) {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).send({ message: "Invalid hotel id!" });

    try {
      const hotel = await Hotel.findById(req.params.id);
      if (!hotel) return res.status(404).send({ message: "Hotel not found!" });

      const index = parseInt(req.params.index);
      if (isNaN(index) || index < 1)
        return res.status(400).send({ message: "Invalid index!" });

      let images = hotel.images;
      if (index > images.length)
        return res.status(404).send({ message: "Image not found!" });

      await Hotel.updateOne(
        { _id: req.params.id },
        {
          $pull: {
            images: {
              $eq: images[index - 1],
            },
          },
          updatedAt: Date.now(),
        }
      );

      if (hotel.image === images[index - 1]) {
        hotel.image = "";
      }

      await hotel.save();

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

  // delete hotel by id
  async deleteHotelById(req, res) {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).send({ message: "Invalid hotel id!" });

    try {
      const hotel = await Hotel.findByIdAndDelete(req.params.id);

      if (!hotel) return res.status(404).send({ message: "Hotel not found!" });

      const rooms = await HotelRoom.find().where({ hotel: req.params.id });

      rooms.forEach((room) => {
        const images = room.images;
        images.forEach((image) => Path.unlinkImagePath(image));
      });

      await HotelRoom.deleteMany().where({ hotel: req.params.id });

      const images = hotel.images;
      images.forEach((image) => Path.unlinkImagePath(image));

      res.status(200).send({
        success: true,
        message: "One hotel has been deleted!",
      });
    } catch (err) {
      res.status(500).send({
        success: false,
        error: err.message,
      });
    }
  }

  // delete all hotels
  async deleteAllHotels(req, res) {
    try {
      const hotels = await Hotel.find();
      if (hotels.length < 1)
        return res.status(404).send({ message: "There's no hotels data!" });

      hotels.forEach((hotel) => {
        const images = hotel.images;
        images.forEach((image) => Path.unlinkImagePath(image));
      });

      await Hotel.deleteMany();

      const rooms = await HotelRoom.find();
      if (rooms.length < 1)
        return res.status(404).send({ message: "There's no rooms data!" });

      rooms.forEach((room) => {
        const images = room.images;
        images.forEach((image) => Path.unlinkImagePath(image));
      });

      await HotelRoom.deleteMany();

      res.status(200).send({
        success: true,
        message: "All hotels has been deleted!",
      });
    } catch (err) {
      res.status(500).send({
        success: false,
        error: err.message,
      });
    }
  }
}
