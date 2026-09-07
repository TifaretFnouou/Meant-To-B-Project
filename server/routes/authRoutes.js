import express from "express";
import { parser } from "../config/cloudinary.js";
import { login, googleLogin, register, me } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", parser.single("profilePicture"), register);
router.post("/login", login);
router.post("/google", googleLogin);
router.get("/me", me);

export default router;
