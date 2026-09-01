import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Storage for profile pictures
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "queens-match/profile-pictures",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      {
        width: 500,
        height: 500,
        crop: "limit",
      },
    ],
  },
});

// Multer parser
const parser = multer({
  storage,
});

export { cloudinary, parser };