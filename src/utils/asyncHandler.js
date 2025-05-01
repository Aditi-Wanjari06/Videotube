const asyncHandler = (requestHandler) => (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).
        catch((error) => next(error))

}

export { asyncHandler }

/*
const asyncHandler = (requestHandler) => async(res,req,next)=>{
    try{
    await requestHandler(req,res,next)
    }
    catch(error){
    res.status(error.code || 400).json({
    success:false,
    message: error.message
    
    })
    }
    }
*/