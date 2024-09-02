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

const deleteFromCloudinary=async (url)=>{
    try {
        if (!url) return null; 
        //delete file from cloudinary
        const deletedResponse=await cloudinary.uploader.destroy(url,{resource_type:"auto"});
        return deletedResponse;
    } catch (error) {
        return null;
    }
}


export {
uploadOnCloudinary,
deleteFromCloudinary
}

