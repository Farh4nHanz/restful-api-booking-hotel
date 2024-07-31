import express from "express";
import HotelController from "../controllers/hotelController.js";
import HotelRoomController from "../controllers/hotelRoomController.js";
import { isAdmin, isAuth } from "../middlewares/authMiddleware.js";
import { addRoomValidator } from "../lib/validation.js";
import { fileUpload } from "../lib/fileUpload.js";

const router = express.Router();
const hotel = new HotelController();
const room = new HotelRoomController();

router
  .get("/", hotel.getAllHotels)
  .get("/:id", hotel.getHotelById)
  .get("/:id/rooms", room.getAllRoomsByHotelId)
  .get("/:id/rooms/:roomId", room.getRoomById);

router
  .post("/", isAuth, isAdmin, hotel.addHotel)
  .post("/:id/rooms", isAuth, isAdmin, addRoomValidator, room.addRoomsByHotelId)
  .post(
    "/:id/images",
    isAuth,
    isAdmin,
    fileUpload.array("images", 10),
    hotel.uploadHotelImagesByHotelId
  )
  .post(
    "/:id/rooms/:roomId/images",
    isAuth,
    isAdmin,
    fileUpload.array("images", 10),
    room.uploadImagesByRoomId
  );

router
  .put("/:id", isAuth, isAdmin, hotel.updateHotelById)
  .put("/:id/rooms/:roomId", isAuth, isAdmin, room.updateRoomById);

router
  .delete("/", isAuth, isAdmin, hotel.deleteAllHotels)
  .delete("/:id", isAuth, isAdmin, hotel.deleteHotelById)
  .delete("/:id/rooms", isAuth, isAdmin, room.deleteAllRoomsByHotelId)
  .delete("/:id/rooms/:roomId", isAuth, isAdmin, room.deleteRoomById)
  .delete("/:id/images/:index", isAuth, isAdmin, hotel.deleteHotelImagesByIndex)
  .delete(
    "/:id/rooms/:roomId/images/:index",
    isAuth,
    isAdmin,
    room.deleteRoomImagesByIndex
  );

export default router;
