import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app=express()
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))


app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes import
import userRouter from './routes/user.routes.js'
import healthcheckRouter from "./routes/healthcheck.routes.js"


//routes declartion
app.use("/api/v1/users", userRouter)
app.use("/api/v1/healthcheck", healthcheckRouter)


app.use((err, req, res, next) => {
    // Log the error (you can customize this part)
    console.error(err.stack);
    // Respond with an appropriate error message
    res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Error From Server' });
});
// http://localhost:8000/api/v1/users/register

export {app}