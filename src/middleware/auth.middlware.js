import jwt, { decode } from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import  {User} from  "../models/user.model.js"

export const verifyJWT =asyncHandler(async(req,_,next)=>{
   try {
     const token=req.cookies.accessToken|| req.header("Authorization")?.replace("Bearer","")
 
     if (!token) {
         throw new ApiError(401,"unauthorize request")
     }
 
     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
 
    const user= await User.findById(decodedToken?._id).select("-password -refreshToken")
 
     if (!user) {
      throw new ApiError(401,"invalid accesss token")        
     }
 
     req.user=user;
     next()
   } catch (error) {
    throw new ApiError(401,error?.message||"invalid access token")
   }


})