import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";


const userSchema = new Schema(
    {
       username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
       },
       email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
       },
       fullname: {
        type: String,
        required: true,
        trim: true,
        index: true,
       },
       avatar: {
        type: String,   // cloudnary url
        required: true,
       },
       coverimage: {
        type: String,   // cloudnary url
       },
       watchHistory: [
        {
          type: Schema.Types.ObjectId, 
          ref: "Videos",
        }
       ],
       password: {
        type: String,
        required: [true, 'Password is required'],
       },
       refreshToken: {
         type: String,
       },
    },
    {
        timpestamps: true,
    }
);

userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();

  this.password = bcrypt.hash(this.password, 10) 
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
 return await bcrypt.compare(password, this.password) 
};

userSchema.method.methods.genrateAccessToken = function () {
  return  jwt.sign(
    {
       _id: this._id,
       email: this.email,
       username: this.username,
       fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
)
};
userSchema.method.methods.genrateRefreshToken = function () {
  return  jwt.sign(
    {
       _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
)
};

export const User = mongoose.model('User', userSchema);