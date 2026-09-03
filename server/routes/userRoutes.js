import express from "express";
import {
  deleteUserController,
  getUserController,
  getAllUsersController,
  getUsersController,
  updateProfilePictureController,
  updateUserController,
} from "../controllers/userController.js";
import { parser } from "../config/cloudinary.js";

const router = express.Router();

router.get("/", getUsersController);
router.get("/all", getAllUsersController);
router.put("/:id/profile-picture", parser.single("profilePicture"), updateProfilePictureController);
router.put("/:id", updateUserController);
router.delete("/:id", deleteUserController);
router.get("/:id", getUserController);

export default router;
