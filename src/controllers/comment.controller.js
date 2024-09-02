import mongoose, { isValidObjectId } from "mongoose";
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { query } from "express";

const getVideoComment = asyncHandler(async(req,res)=>
{
    const {videoId}= req.params
    const {page=1, limit=10}=req.query

    if(!videoId||!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id")
    }

    if (!query||! query.trim()===""){
        throw new ApiError(400,"Query is required")
    }

    const  getComments= await Comment.aggregate([
        {
            $match:{
                video: new mongoose.Types.ObjectId(videoId)
            },
        },
        {
            $lookup:{
                from: "users",
                foreignField: "_id",
                localField:"owner",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullname:1,
                            avatar:1,
                            _id:1
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from: "likes",
                foreignField:"comment",
                localField: "_id",
                as:"likes"
            }
        },
        {
            $addFields:{
                likesCount:{
                    $size:"$likes"
                }
            }
        },
        {
            $project:{
                _id:1,
                username:1,
                fullname:1,
                avatar:1,
                content:1,
                owner:1,
                likesCount:1
            }
        },
        {
            $skip:
                (page-1)*limit,
            
        },
        {
            $limit:parseInt(limit)
        }
    ]);

    if(!getComments||getComments.length===0){
        throw new ApiError(400,"no comment found")
    }


    return res
    .status(200)
    .json(
        new ApiResponse(
        200,
        getComments,
        "comment successfully fetched"
        )
    )

})

const AddComment= asyncHandler(async(req,res)=>{

    const videoId= req.params;
    const userId= req.user?._id;
    const {content} =req.body;

    if(!content){
        throw new ApiError(400,"content is required")
    }

    if(!videoId||!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video id")
    }

    const comment= await Comment.create({
        content,
        video:videoId,
        owner:userId
    });

    if(!comment){
        throw new ApiError(500,"err while adding comment")
    }

    return res.status(200).json(new ApiResponse(
        200,{comment,userId,videoId},"comment added successfully"
    ))
})

const updateComment= asyncHandler(async(req,res)=>{

    const {content}= req.body;
    const{commentId} =req.params;

    if(!content){
        throw new ApiError(400,"content is required")
    }

    if(!commentId||isValidObjectId(commentId)){
        throw new ApiError(400,"invalid comment id")
    }

    const comment=await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(400,"comment not found")
    }
 
    const updateComment=await Comment.findByIdAndUpdate(commentId,
        {
            $set:{content}
        },
        {
            new:true
        }
    );

    if(!updateComment){
        throw new ApiError(400,"comment not updated")
    }

    return res.status(200).json(new ApiResponse(
        {updateComment},"comment updated successfully"
    ))
})

const deleteComment= asyncHandler(async(req,res)=>{
    const commentId= req.params;

    if(!commentId||isValidObjectId(commentId)){
        throw new ApiError(400,"invalid comment id")
    }

   try {
     const comment= await Comment.findById(commentId);
     if(!comment){
         throw new ApiError(400,"comment not found")
     }
 
     const deleteComment= await Comment.findByIdAndDelete(commentId);
 
     if(!deleteComment){
         throw new ApiError(400," err while comment is deleted")
        }
   } catch (error) {
    throw new ApiError(400,"ERR ehile deleting comment", error)
   }

   return res
   .status(200)
   .json(new ApiResponse(
    200,
    {},
    "comment deleted "
   ))
})

export
{
    getVideoComment,
    AddComment,
    updateComment,
    deleteComment
}
