import mongoose,{Schema, Types} from "mongoose";

const tweetSchema= new Schema({
    content:{
        type: String,
        requried:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{timeseries:true})

export const Tweet= mongoose.model("Tweet",tweetSchema)