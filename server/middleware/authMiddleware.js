import { verifyToken } from "../services/authService.js";
import { getUser } from "../services/userService.js";

// middleware to check if the user is logged in (has a valid token)
export const requireAuth = async (req, res, next) => {
  try {
    // 1. use the existing function to verify the token
    const tokenData = verifyToken(req);
    
    // 2. fetch the user from the database
    const user = await getUser(tokenData.id);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    // 3. save the user in the request so that the next middleware can use it
    req.user = user;
    
    // 4. proceed to the next middleware
    next();
  } catch (error) {
    return res.status(401).json({ 
      message: error.message || "Unauthorized - Invalid token" 
    });
  }
};

    // middleware to check if the logged in user has admin permissions
export const isAdmin = (req, res, next) => {
  // we check req.user that is collected by requireAuth
  if (!req.user || !req.user.roles || !req.user.roles.includes("admin")) {
    return res.status(403).json({ 
      message: "Access denied. Admin permissions required." 
    });
  }
  
  // if the user is an admin - allow them to proceed
  next();
};