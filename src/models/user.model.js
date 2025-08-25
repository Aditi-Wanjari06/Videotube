import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true // for searching
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullname: {
            type: String,
            required: true,
            lowercase: true,
            index: true
        },
        avatar: {
            type: String, //cloudinary url
            required: false
        },
        coverImage: {
            type: String, //cloudinary url
            required: false
        },
        password: {
            type: String,
            required: [true, "Password is required"]
        },
        refreshToken: {
            type: String
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ]
    },
    {
        timestamps: true
    }
)

//pre => it is a middleware , "save" is a method
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {

    // console.log("Password from request:", password);
    // console.log("Hashed password from DB:", this.password);

    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
   return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECERT,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function () {
   return jwt.sign(
        {
            _id: this._id,

        },
        process.env.REFRESH_TOKEN_SECERT,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)