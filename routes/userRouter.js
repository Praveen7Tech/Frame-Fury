const express = require("express");
const router = express.Router();
const passport =require("passport")
const userController = require("../controllers/user/userController")
const productController = require("../controllers/user/productController")
const profileController = require("../controllers/user/profileController")
const {userAuth, adminAuth} = require("../middlewares/auth")

router.get("/pageNotFound",userController.pageNotFound)
router.get("/",userController.loadHomepage)

router.get("/signup",userController.loadSignup)
router.post("/signup",userController.signup)

router.post("/verify-otp",userController.verifyOtp)
router.post("/resend-otp",userController.resendOtp)

// passport route
router.get("/auth/google",passport.authenticate("google",{scope:["profile","email"]}));
router.get("/auth/google/callback", passport.authenticate("google",{failureRedirect:"/signup"}),(req,res)=>{
    res.redirect("/")
});

router.get("/login",userController.loadLogin)
router.post("/login",userController.login)
router.get("/logout",userController.logout)

// Product details
router.get("/productDetails",userAuth,productController.productDetails)

// Profile management
router.get("/userProfile",userAuth,profileController.profile);
router.get("/changeEmail", userAuth,profileController.changeEmail)
router.post("/changeEmail",userAuth,profileController.verifyEmail)

router.post("/verify-email-otp",userAuth,profileController.verifyEmailOtp)
router.post("/updateEmail",userAuth,profileController.updateEmail)






module.exports = router;