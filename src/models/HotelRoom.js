import mongoose from "mongoose";

const hotelRoomSchema = mongoose.Schema({
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  number: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    default: ""
  },
  images : [
    {
      type: String,
    }
  ],
  price: {
    type: Number,
    required: true,
  },
  amenities: {
    type: [String],
  },
  availability: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

hotelRoomSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

hotelRoomSchema.set("toJSON", {
  virtuals: true,
});

const HotelRoom = mongoose.model("HotelRoom", hotelRoomSchema);

export default HotelRoom;
