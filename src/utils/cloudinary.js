import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

cloudinary.config({ 
    cloud_name: 'dnminlwen',
    api_key: '577211788221697',
    api_secret:'W7ZmZ_t0Oj_H2pxD9p8Etj1lPKE',
    secure:true,
});



const uploadOnCloudinary= async (localFilePath)=>{
    try {
        if (!localFilePath) return null
        const response= await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        // console.log("file has been uploaded",
        // response.url);
        fs.unlinkSync(localFilePath) //unlike the file so its not stored at public/temp
        return response;   
        
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null;
    }
}

const deleteFromCloudinary = async(file_public_id) => {
    try {

        if (!file_public_id) {
            console.log("File not found");
            return null;
        }

        const response = await cloudinary.uploader.destroy(file_public_id, {
            resource_type: "auto"
        });

        if (response.result === "ok") {
            console.log(`Successfully deleted file with public ID: ${file_public_id}`);
        } else {
            console.log(`Failed to delete file: ${response.result}`);
        }

        return response;

    } catch (error) {
        console.log("error while deleting the file");
        throw error;
    }
}

export {uploadOnCloudinary}

