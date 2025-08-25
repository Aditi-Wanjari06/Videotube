import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/Cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken() //expires in short time
        const refreshToken = user.generateRefreshToken() //epires after long time => save in database and frontend both

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}


const registerUser = asyncHandler(async (req, res) => {
    // get the details from fronted
    // validation check: check empty
    // check if user already exits : email, username
    // check for images, check for avatar
    // upload them to cloudinary: check avatar
    // create user object - create entry in db
    // remove password and refreshToken fields from response
    // check if user is created
    // return res

    // console.log('okkkkkkkkkkkk');
    const { fullname, email, password, username } = req.body
    // console.log(fullname, email, password, username);

    if (
        [fullname, email, password, username].some((field) =>
            field?.trim === ""
        )

    ) {
        console.error("All fields are required");

        throw new ApiError(409, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        console.error("User with email or username already exist");

        throw new ApiError(409, "User with email or username already exist")
    }

    console.error('existedUser ', existedUser);


    // const avatarLocalPath = req.files?.avatar[0].path;
    // const coverImageLocalPath = req.files?.coverImage[0].path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }



    // if (!avatarLocalPath) {
    //     console.error()
    //     throw new ApiError(400, "Avatar file is required")
    // }

    // const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // if(!avatar){
    //     console.error("Avatar file is required");

    //     throw new ApiError(404,"Avatar file is required")
    // }

    // console.log('avataar ');


    const user = await User.create({
        fullname,
        email,
        username: username.toLowerCase(),
        password,
        // avatar: '',
        coverImage: coverImage?.url || ""
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        console.log("Something went wrong while registering the user");
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    console.log('createdUser ', createdUser);


    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered")
    )





})

const logInUser = asyncHandler(async (req, res) => {
    //username, email ->req.body
    //verify username or email to log in 
    //find user
    //password check
    //access and refresh token

    const { username, email, password } = req.body;
    console.log("loggin with email: ", email);
    // console.log("loggin with password", password);


    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")

    // }

    const user = await User.findOne(
        {
            $or: [{ username }, { email }]
        })

    // console.log("Login user: ", user);


    if (!user) {
        throw new ApiError(404, "User not found")
    }

    if (!password) {
        throw new ApiError(400, "Password is required")
    }

    const isPasswordvalidate = await user.isPasswordCorrect(password)

    // console.log("PasswordCorrect: ", isPasswordvalidate);


    if (!isPasswordvalidate) {
        throw new ApiError(401, "Invalid Password")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, {
                user: loggedInUser, accessToken, refreshToken
            },
                "User logged In Successfully."
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id, {
        $set: {
            refreshToken: undefined
        }
    },
        {
            new: true
        }
    )


    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"))

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToekn = req.cookie.refreshToken || req.body.refreshToken //body=> if using mobile 
    
        if (!incomingRefreshToekn) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(incomingRefreshToekn, process.env.REFRESH_TOKEN_SECERT)
    
        const user = User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToekn !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)
    
        res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access Token Refreshed"
    
                )
            )
    
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

export { registerUser, logInUser, logoutUser, refreshAccessToken }