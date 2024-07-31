import mongoose from "mongoose";

const hotelSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: "",
  },
  images: [
    {
      type: String,
    },
  ],
  location: {
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
  },
  contact: {
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
  description: {
    type: String,
    min: 20,
    required: true,
  },
  rooms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HotelRoom",
    },
  ],
  amenities: {
    type: [String],
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  priceRange: {
    min: {
      type: Number,
      required: true,
    },
    max: {
      type: Number,
      required: true,
    },
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

hotelSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

hotelSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

hotelSchema.set("toJSON", {
  virtuals: true,
});

const Hotel = mongoose.model("Hotel", hotelSchema);

export default Hotel;
