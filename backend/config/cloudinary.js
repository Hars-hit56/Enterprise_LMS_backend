import { v2 as cloudinary } from "cloudinary";

import fs from "fs";

const uploadOnCloudinary = async (filePath) => {

    try {
  if (!filePath) {
    return null;
  }


  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });





    //   resource_type: "auto"  its means we store both img and video 
  const uploadResult = await cloudinary.uploader.upload(filePath, {
    resource_type: "auto",
  });


  fs.unlinkSync(filePath);// local file delete

  return uploadResult.secure_url;

} catch (error) {
  fs.unlinkSync(filePath);
  console.log(error);
}

};

export default uploadOnCloudinary;
