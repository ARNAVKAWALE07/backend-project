import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessAndRefreshTokens= async(userId)=>{
    try {
        const user= await User.findById(userId)
        const accessToken= user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken= refreshToken
        await user.save({validateBeforeSave:false})

        return{accessToken,refreshToken}


    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating token")
    }
}

const registerUser = asyncHandler(async (req,res )=>{
// get user detail from frontend
// validation
//check if user already exists
//check from images,
//upload them on cloudinary
//create user object
//remove password and refresh token field from response 
//check for user creation
//return res

const{fullname, email,username, password}= req.body
// console.log("email:", email);

if (
    [fullname, email,username,password].some((field)=>
    field?.trim()==="")
){
    throw new ApiError(400,"all fields are required")
}

const existedUser= await User.findOne({
    $or:[{username},{email}]
})
    if (existedUser){
        throw new ApiError(409,"user with email already exists")
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;
    
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar files is required")
    } 

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
      throw new ApiError(400,"avatar files is required")
    }
    
    const user=await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url||"",
        email,
        password,
        username:username.toLowerCase()
    })


   
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"somethimg went wrong")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"user registered successfully")
    )



})


const loginUser= asyncHandler(async(req,res)=>{
    // req body -> data
    //username or email
    // find user
    //password check 
    // acess and refresh token
    // send cookie 
    
    const {email,username,password}=req.body
    console.log(email);
    
    
    if (!username && !email ){
        throw new ApiError(400,"USERNAME OR EMAIL IS REQUIRED")
    }

    const user=await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(400,"USER DOES NOT EXIST")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    
    if(!isPasswordValid){
        throw new ApiError(401,"password is incorrect")
    }

    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    }
 
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken: 1 // this removes the field from doc
            }
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged Out"))
})

const refreshAccessToken =asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken||req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401,"unauthorized request")
    }

   try {
     const decodedToken=jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
     )
 
    const user= awaitUser.findById(decodedToken?._id)
 
    if (user) {
     throw new ApiError(401,"invalid refresh token")
    }
 
    if (incomingRefreshToken!==user?.refreshToken) {
     throw new ApiError(401,"refresh token is expired")
    }
 
    const options={
     httpOnly:true,
     secure:true
    }
 
    const{accessToken,newrefreshToken}=await generateAccessAndRefreshTokens (user._id)
 
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newrefreshToken,options)
    .json(
     new ApiResponse(
         200,
         {accessToken,refreshToken:newrefreshToken}
     )
    )
   } catch (error) {
    throw new ApiError(401, error?.message||"inalied refresh token")
   }
})

const changeCurrentPassword= asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}= req.body

    const user=await User.findById(req.user?._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

    if (isPasswordCorrect) {
        throw new ApiError(400,"invalid old password")
    }
    

    user.password=newPassword
   await user.save({validateBeforeSave:false})

   return res
   .status(200)
   .json(new ApiResponse(200,{},"NEW PASSWORD SET"))
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"current user fetched successfully")
})

const updateAccountDetail=asyncHandler(async(req,res)=>{
    const {fullname,email}=req.body

    if (!fullname||!email) {
        throw new ApiError(400,"all fields are required")
    }

   const user= await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email,

            }
        },
        {new:true}

    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"account detail updated"))
})

const updateUserAvatar=asyncHandler(async(req,res)=>{

    const avatarLocalPath=req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400,"error while uploading on avatar")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200,user,"avatar file updated successfully"))
})
const updateUserCoverImage=asyncHandler(async(req,res)=>{

    const coverImageLocalPath=req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400,"coverimage file is missing")
    }

    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400,"error while uploading on coverImage")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"avatar file updated successfully"))
})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params

    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }

    const channel= await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },{
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },{
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },{
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id, "$subscribers.subscribers"]},
                        then:true,
                        else:false
                    }
                }
            }
        },{
            $project:{
                fullname:1,
                username:1,
                subscriberCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
    ])
    console.log(channel);

    if (!channel?.length) {
        throw new ApiError(404, "chaanel doesn't exists")    
    }
     
    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"user channel fetch successfully")
    )
    
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user= await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)

            }
        },{
            $lookup: {
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[

                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },{
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
   ])

   return res
   .status(200)
   .json(new ApiResponse(200,user[0].watchHistory,"Watch historry fetched successfully"))
})


export{
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetail,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}