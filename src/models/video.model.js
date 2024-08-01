import mongoose, {Schema} from "mongoose";

import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({

},{timeseries:true});


export const Video = mongoose.model("Video", videoSchema);