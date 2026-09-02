import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import "dotenv/config";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const memoryStorage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  if (!file.mimetype?.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"), false);
  }
  cb(null, true);
};

export const parser = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

export function uploadProfileImage(file) {
  if (!file?.buffer) {
    return Promise.reject(new Error("No image file provided"));
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "queens-match/profile-pictures",
        resource_type: "image",
        transformation: [{ width: 500, height: 500, crop: "limit" }],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (!result?.secure_url) {
          return reject(new Error("Cloudinary did not return a secure URL"));
        }
        resolve(result.secure_url);
      }
    );

    stream.end(file.buffer);
  });
}

export { cloudinary };
