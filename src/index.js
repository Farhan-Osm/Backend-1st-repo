// require('dotenv').config({path: './env'})

// import mongoose from 'mongoose';
// import DB_NAME from './constants';

import connectDB from './db/index.js';
import dotenv from "dotenv";
import { app } from './app.js';

dotenv.config({path: './env'})

const port = process.env.PORT || 3000;
connectDB()

.then(() => {
    app.listen(port,()  => {
        console.log(`server is running at port ${port}`)
    })

    app.on("error", (err) => {
        console.log("server error", err)
    });
})
.catch((error) =>{
    console.log("Mongo DB connection Failed!!", error);
})








// import express from 'express';

// const app = express();


// (async () =>{
//     try {
//       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//       app.on("error", (error) => {
//         console.log("ERROR!", error);
//         throw error;
//       })

// app.listen( process.env.PORT, () => {
//     console.log(`app listening on port: ${process.env.PORT}`)
// });

//     } catch (error) {
//         console.log("ERROR!",error);
//         throw error;
//     }
// }) ();

