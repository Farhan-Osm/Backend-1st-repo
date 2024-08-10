import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';




    // Configuration

    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });



     // Upload file in cloudinary

     const uploadOnCloudinary = async (localFilePath) => {
         try {
            if (!localFilePath) return null;
            // Upload file in cloudinary
            const response = await cloudinary.uploader.upload(localFilePath, {
                resource_type: 'auto'
            });
            //  File is successfully uploaded
            console.log('File Upload successful in cloudinary', response.url);
            return response;
         } catch (error) {
            fs.unlinkSync(localFilePath) // remove temporary locally uploaded file path operations failed
            return null;        
         }
     } 
    

     export {uploadOnCloudinary}