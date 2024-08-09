import asyncHandler from '../utils/asyncHendler.js';

const registerUser = asyncHandler(async (req, res) => {
    res.status(200).json({
        message: "Farhan is already registered",
    })
}) 


export {registerUser}