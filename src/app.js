import express from "express"
import cookieParser from "cookie-parser";
import cors from "cors"

const app = express();

app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,
        credentials: true
    }
))

app.use(express.json({ limit: "16kb" })) //data comes in json
app.use(express.urlencoded({ extended: true, limit: "16kb" })) //searching tab: ?,$,%
app.use(express.static("public")) // if data couldn't retrieve from cloudinary, then it temperorily stored in server which is public folder
app.use(cookieParser())


export { app };