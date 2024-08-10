import asyncHandler from '../utils/asyncHendler.js';
import { User } from '../models/user.model.js';
import {ApiError} from '../utils/ApiError.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';


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

            throw new ApiError(409, "user with email or username already exists");
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

}) 


export {registerUser}