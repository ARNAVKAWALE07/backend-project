import mongoose, { isValidObjectId } from "mongoose";
import {like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";


const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const userId= req.params

    if(!videoId||isValidObjectId(videoId))
    {
        throw new ApiError(400,"video ID not found")
    }

    try {
        const video= await Video.findById(videoId);
    
        if(!video){
            throw new ApiError(400," video not found")
        }
    
        const isLiked= await like.findOne({
            video:videoId,
            likedBy:userId
        });
    
        if(isLiked){
            const unLiked=await like.findByIdAndDelete(isLiked._id);
    
            return res
            .status(200)
            .json(new ApiResponse(200, unLiked,"video unliked"))
        }else{
            const liked= await like.create({
                video:videoId,
                likedBy:userId
            });
    
            return res
            .status(200)
            .json(new ApiResponse(200,liked,"video liked"))
        }
    } catch (error) {
        throw new ApiError(400,"err while liking video",error)
    }

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
   }

   const userId = req.user?._id;
   const comment = await Comment.findById(commentId);

   if(!comment) {
       throw new ApiError(404, "Comment not found");
   }

   const isLiked = await Like.findOne({
       comment: commentId,
       likedBy: userId
   })

   if(isLiked) {
     const unliked = await Like.findByIdAndDelete(isLiked._id);
     if(!unliked) {
       throw new ApiError(500, "Error while unliking the comment");
     }
   } else{
       const liked = await Like.create({
           comment: commentId,
           likedBy: userId
       });

       if(!liked) {
           throw new ApiError(500, "Error while liking the comment");
       }
   }

   return res
   .status(200)
   .json(
       new ApiResponse(200, {}, "Successfully updated liked status")
   )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!tweetId||isValidObjectId(tweetId)){
        throw new ApiError(400, "invalid tweet id")
    }

    const tweet= await Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(404,"tweet not found")
    }

    const userId= req.body?._id;

    const isLiked=await like.findOne({
        tweet:tweetId,
        likedBy:userId
    });

    if(isLiked){
        const unLiked=await
        like.findByIdAndDelete(isLiked._id);
        if(!unLiked){
            throw new ApiError(400,"err while unliking tweet")
        }else{
            const liked=await like.create({
                tweet:tweetId,
                likedBy:userId
            });

            if(!liked){
                throw new ApiError(500, "err while likimg tweet")
            }
        }

        return res
        .status(200)
        .json(new ApiResponse(200,{},"Successfully updated like status"))
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideo= await like.aggregate(
        [
            {
                $match:{
                    likedBy: new mongoose.Types.ObjectId(req.user?._id)
                }
            },
            {
                $lookup:{
                    from:"videos",
                    foreignField:"_id",
                    localField:"video",
                    as:"video",
                    pipeline:[
                        {
                            $lookup:{
                                from:"users",
                                foreignField:"_id",
                                localField:"owner",
                                as:"owner",
                                pipeline:[
                                    {
                                        $project:{
                                            avatar:1,
                                            username:1,
                                            fullname:1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields:{
                                owner:{
                                    $first: "$owner"
                                }
                            }
                        }
                    ]
                }
            },
            {
                $addFields:{
                    video:{
                        $first:"$video",

                    }
                }
            },
            {
                $match:{
                    video:{
                        $first:{$exists:true}
                    }
                }
            }
        ]
    );

    if(!likedVideo?.length){
        throw new ApiError(400,"no like video found for this user")

        return res
        .status(200)
        .json(new ApiResponse(200,likedVideo,"liked video fetched successfully"))
    }
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}