const User = require("../models/userSchema");


const userAuth = (req, res, next) => {
    if (req.session.user) {
        User.findById(req.session.user)
            .then(data => {
                if (data) {
                    if (!data.isBlocked) {
                        next(); 
                    } else {
                        req.session.destroy(() => {
                            res.redirect("/login");
                        });
                    }
                } else {
                    res.redirect("/login");
                }
            })
            .catch(error => {
                console.log("Error in userAuth middleware", error);
                res.status(500).send("Internal server error");
            });
    } else {
        res.redirect("/login");
    }
};

const adminAuth = (req,res,next)=>{
   if(req.session.admin){
    User.findOne({isAdmin:true})
    .then(data=>{
        if(data){
            next()
        }else{
            return res.redirect("/admin/login")
        }
    })
    .catch(error=>{
        console.error("Error in Login Admin panel",error)
        res.status(500).send("Internal Server Error..")
    })
   }
}

//error handling middleware
// const errorHandlingMid = (err, req, res, next) => {
//     console.error("Error ",err.message);

//     res.status(err.status || 500).json({
//         success: false,
//         message: err.message || "Internal Server Error",
//     });
// };




module.exports={
    userAuth,
    adminAuth,
    // errorHandlingMid
}