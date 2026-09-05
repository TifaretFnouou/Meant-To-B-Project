import {
  loginUser,
  registerUser,
  verifyToken,
  sanitizeUser,
} from "../services/authService.js";
import { getUser } from "../services/userService.js";

function statusFromError(error, fallback = 400) {
  return error.status || fallback;
}

export const register = async (req, res) => {
  try {
    const { user, token } = await registerUser(req.body, req.file);

    res.status(201).json({
      message: "User has been registered successfully",
      user,
      token,
    });
  } catch (error) {
    res.status(statusFromError(error, 400)).json({
      message: error.message || "Error occurred registering user",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { user, token } = await loginUser(req.body);

    res.status(200).json({
      message: "User logged in successfully",
      user,
      token,
    });
  } catch (error) {
    res.status(statusFromError(error, 400)).json({
      message: error.message || "Error occurred logging in the user",
    });
  }
};

export const me = async (req, res) => {
  try {
    const tokenData = verifyToken(req);
    const user = await getUser(tokenData.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(statusFromError(error, 401)).json({
      message: error.message || "Unauthorized",
    });
  }
};
