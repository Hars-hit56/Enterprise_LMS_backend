import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const uploadOnCloudinary = async (filePath) => {
  try {
    if (!filePath) return null;

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Standardize path for Cloudinary
    const normalizedPath = filePath.replace(/\\/g, "/");

    const result = await cloudinary.uploader.upload(normalizedPath, {
      resource_type: "auto",
    });

    // Cleanup local file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result.secure_url;

  } catch (error) {
    console.error("CLOUDINARY UPLOAD ERROR =>", error);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return null;
  }
};

export default uploadOnCloudinary;