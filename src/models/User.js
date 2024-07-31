import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    default: "",
  },
  state: {
    type: String,
    default: "",
  },
  country: {
    type: String,
    default: "",
  },
  address: {
    type: String,
    default: "",
  },
  zipCode: {
    type: Number,
    default: null,
  },
  payment: {
    method: {
      type: String,
      enum: ["credit_card", "debit_card", "paypal"],
      default: null,
    },
    cardNumber: {
      type: Number,
      maxlength: 16,
      default: null,
    },
    cvv: {
      type: Number,
      maxlength: 3,
      default: null,
    },
    expiresDate: {
      type: String,
      default: "",
    },
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

userSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

userSchema.set("toJSON", {
  virtuals: true,
});

const User = mongoose.model("User", userSchema);

export default User;
