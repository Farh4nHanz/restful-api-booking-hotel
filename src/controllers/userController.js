import mongoose from "mongoose";
import User from "../models/User.js";
import { hashPassword } from "../lib/hashPassword.js";
import passport from "passport";
import "../strategies/localStrategy.js";
import { validationResult } from "express-validator";

export default class UserController {
  // register
  async register(req, res) {
    try {
      const { name, username, email, password, isAdmin } = req.body;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMsg = errors.array().map((error) => error.msg);
        return res.status(400).send({
          success: false,
          message: "Registration failed!",
          errors: {
            error: errorMsg.length,
            msg: errorMsg,
          },
        });
      }

      const hashedPassword = await hashPassword(password);

      let createUser = new User({
        name,
        username,
        email,
        password: hashedPassword,
        isAdmin,
      });

      createUser = await createUser.save();

      createUser
        ? res.status(201).send({
            message: "Registration success!",
            user: createUser,
          })
        : res
            .status(400)
            .send({ success: false, message: "Registration failed!" });
    } catch (err) {
      res.status(500).send({
        success: false,
        error: err.message,
      });
    }
  }

  // login
  login(req, res, next) {
    try {
      passport.authenticate("local", (err, user, info) => {
        if (err) throw err;

        if (!user) {
          return res.status(400).send({
            success: false,
            message: info.message,
          });
        }

        req.logIn(user, (err) => {
          if (err) throw err;

          return res.status(200).send({
            success: true,
            message: "Login Success!",
            user: {
              id: user.id,
              name: user.name,
              isAdmin: user.isAdmin,
            },
          });
        });
      })(req, res, next);
    } catch (err) {
      res.status(500).send({
        success: false,
        error: err.message,
      });
    }
  }

  // logout
  logout(req, res) {
    try {
      req.logout(() =>
        res.status(200).send({ success: true, message: "You're logged out!" })
      );
    } catch (err) {
      res.status(500).send({
        success: false,
        error: err.message,
      });
    }
  }

  // get all users
  async getAllUsers(req, res) {
    const queryMap = {
      name: (value) => ({
        name: {
          $regex: value,
          $options: "i",
        },
      }),
      username: (value) => ({
        username: {
          $regex: value,
          $options: "i",
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
      const user = await User.find(filter).select([
        "name",
        "username",
        "email",
        "isAdmin",
      ]);

      user
        ? res.status(200).send({
            count: user.length,
            users: user,
          })
        : res.status(404).send({
            message: "No user's data.",
          });
    } catch (err) {
      res.status(500).send({
        success: false,
        error: err.message,
      });
    }
  }

  // get user by id
  async getUserById(req, res) {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).send({ message: "Invalid user id!" });

    try {
      const user = await User.findById(req.params.id);

      user
        ? res.status(200).send({ user: user })
        : res.status(404).send({
            success: false,
            message: "User not found!",
          });
    } catch (err) {
      res.status(500).send({
        success: false,
        error: err.message,
      });
    }
  }

  // update user by id
  async updateUserById(req, res) {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).send({ message: "Invalid user id!" });

    try {
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

      const user = await User.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body,
        },
        { new: true }
      );

      if (!user)
        return res.status(404).send({
          success: false,
          message: "User not found!",
        });

      const newUser = await user.save();

      res.status(201).send({
        success: true,
        message: "User has been updated!",
        updatedUser: newUser,
      });
    } catch (err) {
      res.status(500).send({
        success: false,
        error: err.message,
      });
    }
  }

  // delete all users
  async deleteAllUsers(req, res) {
    try {
      const user = await User.countDocuments().where({ isAdmin: false });

      if (user < 1)
        return res.status(404).send({
          success: false,
          message: "There's no users data",
        });

      await User.deleteMany().where({ isAdmin: false });
      res.status(200).send({
        success: true,
        message: "All users has been deleted!",
      });
    } catch (err) {
      res.status(500).send({
        success: false,
        error: err.message,
      });
    }
  }

  // delete user by id
  async deleteUserById(req, res) {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).send({ message: "Invalid user id!" });

    try {
      const user = await User.findByIdAndDelete(req.params.id);

      user
        ? res.status(200).send({
            success: true,
            message: "User has been deleted!",
          })
        : res.status(404).send({
            success: false,
            message: "User not found!",
          });
    } catch (err) {
      res.status(500).send({
        success: false,
        error: err.message,
      });
    }
  }
}
