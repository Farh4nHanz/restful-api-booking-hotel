import express from "express";
import UserController from "../controllers/userController.js";
import { isAdmin, isAuth, stillAuth } from "../middlewares/authMiddleware.js";
import { registerValidator, updateUserValidator } from "../lib/validation.js";

const router = express.Router();
const user = new UserController();

router
  .get("/", isAuth, isAdmin, user.getAllUsers)
  .get("/:id", isAuth, isAdmin, user.getUserById);

router
  .post("/register", stillAuth, registerValidator, user.register)
  .post("/login", stillAuth, user.login)
  .post("/logout", isAuth, user.logout);

router.put("/:id", isAuth, isAdmin, updateUserValidator, user.updateUserById);

router
  .delete("/", isAuth, isAdmin, user.deleteAllUsers)
  .delete("/:id", isAuth, isAdmin, user.deleteUserById);

  export default router;
