import mongoose, { isValidObjectId } from "mongoose";
import {Playlist} from "../models/playlist.model"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse, Apiresponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if (!name|| name.trim()===""){
        throw new ApiError(400,"name is required")
    }

    const playlist= await Playlist.create({
        name,
        description:description||"",
        owner:req.user?._id,
    });
    //TODO: create playlist
    if(!playlist){
        throw new ApiError(400," err while creating playlist")
    }

    return res
    .status(200)
    .json(new Apiresponse(
        200, playlist,"playlist created successfully"
    ))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if(!userId||isValidObjectId(userId)){
        throw new ApiError(400,"user id is not valid")
    }

    const playlist= await Playlist.aggregate(
        [
            {
                $match:{
                    owner:new mongoose.Types.ObjectId(userId),
                }
            }
        ]
    );

    if (!playlist.length){
        throw new ApiError(400, "no playlist found for this user")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200, playlist,"playlist fetched successfully"
    ))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist Id");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(500, "Error while fetching playlist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(400, "Playlist not found");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(400, "Video not found");
    }

    if (playlist?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            401,
            "you do not have permission to perform this action"
        );
    }

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already in playlist");
    }

    const addToPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: videoId,
            },
        },
        { new: true }
    );

    if (!addToPlaylist) {
        throw new ApiError(500, "Error while adding video to playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                addToPlaylist,
                "Video added to playlist successfully"
            )
        );
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(400, "Playlist not found");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(400, "Video not found");
    }

    if (playlist?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            401,
            "you do not have permission to perform this action"
        );
    }

    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video not in playlist");
    }

    const removeVideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: {
                    $in: [`${videoId}`],
                },
            },
        },
        { new: true }
    );

    if (!removeVideo) {
        throw new ApiError(
            500,
            "Something went wrong while removing video from playlist"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                removeVideo,
                "video removed from playlist successfully"
            )
        );
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(400, "Playlist not found");
    }

    if (playlist?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            401,
            "you do not have permission to perform this action"
        );
    }

    const delPlaylist = await Playlist.findByIdAndDelete(playlistId);

    if (!delPlaylist) {
        throw new ApiError(500, "Error while deleting playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, delPlaylist, "Playlist deleted successfully")
        );
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(400, "Playlist not found");
    }

    if (!name && !description) {
        throw new ApiError(400, "Atleast one of the field is required");
    }

    if (playlist?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            401,
            "you do not have permission to perform this action"
        );
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name: name || playlist?.name,
                description: description || playlist?.description,
            },
        },
        { new: true }
    );

    if (!updatedPlaylist) {
        throw new ApiError(500, "Error while updating playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Playlist updated successfully"
            )
        );
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}