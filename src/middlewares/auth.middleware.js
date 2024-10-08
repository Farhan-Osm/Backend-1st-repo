import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHendler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";


export const verifyJWT = asyncHendler(async (req, res, next) => {
  try {
      const token =  await req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
      if(!token) {
          throw new ApiError(401, "unauthorized request");
      }
  
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  
      const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
      if (!user) {
          throw new ApiError(401, "Invilid Access Token");
      }
  
      req.user = user;
      next();
  }
  catch (error) {
    throw new ApiError(401, error?.message || "Invilid Access Token please check");
  }
})
