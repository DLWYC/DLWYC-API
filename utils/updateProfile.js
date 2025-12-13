const cloudinary = require("cloudinary").v2;

cloudinary.config({
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
     api_key: process.env.CLOUDINARY_API_KEY,
     api_secret: process.env.CLOUDINARY_API_SECRET,
});

const deleteFromCloudinary = async (publicId) => {
     try {
          const result = await cloudinary.uploader.destroy(publicId);
          return result;
     } catch (error) {
          console.error('Cloudinary delete error:', error);
          throw error;
     }
};


const uploadBase64ToCloudinary = async (base64String, folder) => {
     try {
          const result = await cloudinary.uploader.upload(base64String, {
               folder: "DLWYC_YOUTHS",
               resource_type: 'auto',
               transformation: [
                    { width: 500, height: 500, crop: 'limit' },
                    { quality: 'auto' }
               ]
          });
          return result;
     } catch (error) {
          console.error('Cloudinary upload error:', error);
          throw error;
     }
};


module.exports = { deleteFromCloudinary, uploadBase64ToCloudinary }