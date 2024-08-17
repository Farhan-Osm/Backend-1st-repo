import asyncHandler from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import {ApiError} from '../utils/ApiError.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken";


const genrateAccessAndRefreshTokens = async(userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.genrateAccessToken();
    const refreshToken = user.genrateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return {accessToken, refreshToken} 
    

  } catch (error) {
    throw new ApiError(500, "somthing went wrong while generating token");
  }
}

//  register user
const registerUser = asyncHandler(async (req, res) => {
    
        //  get user details from frontend
        //  validation- not empty
        //  check if user already exists: username, email
        //  check for images, check for avatar
        //  upload them to cloudinarty, avatar
        //  create user object, create entry in db
        //  remove password and refresh token field from response
        //  check for user creation
        //  return res

          //  get user details from frontend
        const {fullname,email,username,password} = req.body
        console.log("email: " , email);

          //  validation- not empty
        if (
            [fullname,email,username,password].some((field) =>
            field?.trim() === "")
        ) {
            throw new ApiError(400, "All fields are required");
        }

          //  check if user already exists: username, email
        const existedUser = await User.findOne({
            $or: [{ username } , { email }]  
        }) 
        if (existedUser){

            throw new ApiError(409, "This email or username already exists");
        }

          //  check for images, check for avatar
        const avatarLocalPath =  req.files?.avatar[0]?.path;
        const coverImageLocalPath = req.files?.coverImage[0]?.path; 

        if(!avatarLocalPath){
            throw new ApiError(400, "avatar file is missing");
        }

          //  upload them to cloudinarty, avatar
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);
        if (!avatar){
            throw new ApiError(400, "avatar file is not available");
        }

          //  create user object, create entry in db
        const user = await User.create({
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase(),

        })

          //  check for user creation
        const createUser = await User.findById(user._id).select(
            "-password -refreshToken" 
        ) 
        if (!createUser){
            throw new ApiError(500, "something went wrong while register a user")
        }

          //  return res
        return res.status(201).json(
            new ApiResponse(200, createUser, "user registered successfully")
        )

}); 

//  login user
const loginUser =  asyncHandler(async (req, res) => {
    // request body -> data
    // username or email
    // find the user 
    // password check
    // access and refresh tokens
    // send cookies


    // request body -> data
    const {email, username, password} = req.body

    // username or email
    if (!email && !username) {
      throw new ApiError(400, "username ro email is required");
    }

    // find the user 
    const user = await User.findOne({$or: [{username}, {email}]});

    if (!user){
      throw new ApiError(404, "user does not exist");
    }

     // password check
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "incorrect password");
    }

     // access and refresh tokens
    const { accessToken, refreshToken } = await genrateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password, -refreshToken");

     // send cookies
     const options = {
      httpOnly: true,
      secure: true, 
     };

     return res
     .status(200)
     .cookie("accessToken", accessToken , options)
     .cookie("refreshToken", refreshToken, options)
     .json(
      new ApiResponse(
        200,{
          user: loggedInUser, accessToken, refreshToken
        },"User logged In Successfully"
      )
     )
});

//  logout User
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1
      }
    },
    {
      new: true,
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  };

  return res.status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "user logout successfully"));
});

//  refresh Access Token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incommingRefreshToken){
    throw new ApiError(401, "unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    )
    const user = await User.findById(decodedToken?._id)
  
    if(!user) {
      throw new ApiError(401, "Invalid refresh token")
    }
  
    if (incommingRefreshToken !== user?.refreshToken){
      throw new ApiError(401, "Refresh token is expired or invalid")
    }
  
    const options = {
      httpOnly: true,
      secure: true
    }
  
    const {accessToken, newRefreshToken} = await genrateAccessAndRefreshTokens(user._id)
  
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(
        200,
        {accessToken, refreshToken: newRefreshToken},
        "Access Token refreshed"
      )
    )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }
});

//  changed password
const changeCurrentPassword = asyncHandler(async (req, res) => {

  const {oldPassword, newPassword} = req.body

  const user = await User.findById(req.user?._id)

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid password")
  }
  user.password = newPassword

  await user.save({validateBeforeSave: false})

  return res
  .status(200)
  .json(new ApiResponse(200, {}, "password changed successfully"))
})

//  current user access
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
  .status(200)
  .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})

//  user update access 
const updateAccountDetails = asyncHandler(async (req, res) => {

  const {fullname, email} = req.body

  if (!(fullname || email)) {
    throw new ApiError(400, "All fields sre required")
  } 

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email: email
      }
    },
    {
      new: true
    }
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "Account updated successfully"))
})

//  update Avatar
const updateUserAvatar = asyncHandler(async (req, res) => {

  const avatarLocalPath =  req.file?.path

  if (!avatarLocalPath){
    throw new ApiError(400, "Avatar file not found")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar) {
    throw new ApiError(400, "Error uploading avatar while uploading on avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      avatar: avatar.url
    },
    {
      new: true
    }
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "Avatar uploaded successfully"))

})

//  update Coverimage 
const updateUserCoverImage = asyncHandler(async (req, res) => {

  const coverImageLocalPath =  req.file?.path

  if (!coverImageLocalPath){
    throw new ApiError(400, "coverImage file not found")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!coverImage) {
    throw new ApiError(400, "Error uploading CoverImage while uploading on avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      coverImage: coverImage.url
    },
    {
      new: true
    }
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "CoverImage uploaded successfully"))

})

//  subscripition details
const getUserChannelProfile = asyncHandler(async (req, res) => {

  const {username} = req.params

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing")
  }

// pipelines
  const channel = await User.aggregate([
    {
      $match: {
        username: username?. toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        channelSubscriberCount: {
          $size: "subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelSubscriberCount: 1,
        coverImage: 1,
        avatar: 1,
        email: 1,


      }
    }
  ])

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exists")
  }

  return res
  .status(200)
  .json(new ApiResponse (200, channel[0], "User channel fetched successfully"));

})

//  watch History pipeline
const getWatchHistory = asyncHandler(async (req, res) =>{

  const user = await User.aggregate([
  { 
    $match: {
      _id: new mongoose.Types.ObjectId(req.user._id)
    }
  },
  {
    $lookup: {
      from: "videos",
      localFields: "watchHistory",
      foreignField: "_id",
      as: "watchHistory",
      pipeline: [
        {
          $lookup: {
            from: "users",
            localFields: "owners",
            foreignField: "_id",
            as: "owner",
            pipeline: [
              {
                $project: {
                  fullname: 1,
                  username: 1,
                  avatar: 1,
                }
              }
            ]
          }
        },
        {
          $addFields : {
            owner: {
              $first: "$owner"
            }
          }
        }
      ]
    }
  }
  ])
  return res
  .status(200)
  .json(new ApiResponse (200, user[0].watchHistory, "watch history fetched successfully"))
})

export { registerUser, 
  loginUser, logoutUser, 
  refreshAccessToken, 
  changeCurrentPassword, 
  getCurrentUser,
  getWatchHistory, 
  updateAccountDetails, 
  updateUserAvatar, 
  updateUserCoverImage, 
  getUserChannelProfile }