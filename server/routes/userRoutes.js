
import express from "express";

const router = express.Router();

import {
  deleteUserController,
  getUserController,
  getAllUsersController,
  updateProfilePictureController,
  updateUserController,
} from "../controllers/userController.js";

import { cloudinary, parser } from "../config/cloudinary.js";

// Update user profile
router.put("/:id", updateUserController);

// Update profile picture
router.put(
  "/:id/profile-picture",
  parser.single("profilePicture"),
  updateProfilePictureController
);

// Delete user
router.delete("/:id", deleteUserController);

// Admin: get all users
router.get("/all", getAllUsersController);

// Get user by ID
router.get("/:id", getUserController);

export default router;