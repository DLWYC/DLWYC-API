const express = require('express')
const router = express.Router()
const { userModel } = require('../../models/userModels');
const { uploadBase64ToCloudinary, deleteFromCloudinary } = require('../../utils/updateProfile');


router.post('/', async (req, res) => {
     const userId = req.user.id;
     const {
          fullName,
          phoneNumber,
          gender,
          age,
          profilePicture // Base64 image string
     } = req.body;

     console.log("This is the User ID from auth middleware:", fullName, userId);

     try {
          const user = await userModel.findOne({ _id: userId });
          let profilePictureUrl = user?.profilePicture;
          let cloudinaryPublicId = user?.cloudinaryPublicId;

          if (!user) {
               return res.status(404).json({ message: 'User not found' });
          }


          // Delete the image and Upload a new one
          if (profilePicture && profilePicture.startsWith('data:image')) {
               try {
                    // Delete old profile picture from Cloudinary if it exists
                    if (user?.profilePicture && user?.profilePicture.includes('cloudinary')) {
                         // Extract public_id from the URL
                         const urlParts = user?.profilePicture.split('/');
                         const uploadIndex = urlParts.indexOf('upload');
                         const publicIdParts = urlParts.slice(uploadIndex + 2); // Skip 'upload' and version
                         const publicIdWithExtension = publicIdParts.join('/');
                         const publicId = publicIdWithExtension.split('.')[0]; // Remove extension

                         await deleteFromCloudinary(publicId);
                    }

                    // Upload new profile picture directly from base64
                    const result = await uploadBase64ToCloudinary(profilePicture, 'profile_pictures');
                    profilePictureUrl = result?.secure_url;
                    cloudinaryPublicId = result?.public_id;


               } catch (error) {
                    console.error('Error handling profile picture:', error);
                    return res.status(500).json({
                         success: false,
                         message: 'Error uploading profile picture',
                         error: error.message
                    });
               }
          }

          // Update user fields
          user.fullName = fullName || user?.fullName;
          user.phoneNumber = phoneNumber || user?.phoneNumber;
          user.gender = gender || user?.gender;
          user.age = age || user?.age;
          user.profilePicture = profilePictureUrl;
          user.cloudinaryPublicId = cloudinaryPublicId;
          user.updatedAt = Date.now();

          // Save updated user
          const updateUser = await user.save();
          console.log("jsdnfjsdnf", updateUser)


          res.status(200).json({
               success: true,
               message: 'Profile updated successfully',
               data: updateUser?.message
          });

     } catch (error) {
          console.error('Update profile error:', error);
          res.status(500).json({
               success: false,
               message: 'Server error',
               error: error.message
          });
     }

})


module.exports = router