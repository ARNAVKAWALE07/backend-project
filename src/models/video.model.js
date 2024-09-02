import mongoose,{mongo, Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema= new Schema(
    {
        videoFiles:{
            type: String,
            required:true
        },
        thumbnail:{
            type:String,
            required:true
        },
        title:{
            type: String,
            required: true
        },
        discription:{
            type: String,
            required: true
        },
        duration:{
            type: Number,
            required: true
        },
        views:{
            type:Number,
            default:0
        },
        isPublished:{
            type: Boolean,
            defaukt: true
        },
        owner:{
            type: Schema.Types.ObjectId,
            ref:"User"
        },        
        thumbnail_public_id: {
            type: String,
            required: true
        },

        videoFile_public_id: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }

)
videoSchema.index({
    title:"text",
    description:"text"
})


videoSchema.plugin(mongooseAggregatePaginate)


export const Video = mongoose.model("Video",videoSchema)