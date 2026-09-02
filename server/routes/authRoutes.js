

import express from "express";
import { parser } from "../config/cloudinary.js";

import {
  login,
  register,
  me,
} from "../controllers/authController.js";


const router = express.Router();

// Register new user
router.post("/register", parser.single("profilePicture"), register);

// Login existing user
router.post("/login", login);

// Current user (requires token)
router.get("/me", me);

export default router;