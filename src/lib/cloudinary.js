import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadImage = async (fileStr, folder = 'porville') => {
  try {
    // fileStr can be a local path, web URL, or base64 data URL
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      folder: folder,
    });
    return {
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export const deleteImage = async (publicId) => {
  try {
    const response = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};
