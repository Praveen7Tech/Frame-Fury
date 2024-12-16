const express = require("express");
const router = express.Router();
const passport =require("passport")
const userController = require("../controllers/user/userController")
const productController = require("../controllers/user/productController")
const profileController = require("../controllers/user/profileController")
const cartController = require("../controllers/user/cartController")
const checkOutController = require("../controllers/user/checkoutcontroller")
const orderController = require("../controllers/user/orderController")
const {userAuth, adminAuth} = require("../middlewares/auth")

router.get("/pageNotFound",userController.pageNotFound)
// hope page
router.get("/",userController.loadHomepage)

//shopping page
router.get("/shoppingPage",userAuth,userController.shoppingPage)
router.get("/filter",userAuth,userController.filterProduct)
router.get("/filterPrice",userAuth,userController.filterByPrice)
router.post("/search",userAuth,userController.SearchProducts)

//signup
router.get("/signup",userController.loadSignup)
router.post("/signup",userController.signup)

router.post("/verify-otp",userController.verifyOtp)
router.post("/resend-otp",userController.resendOtp)

// passport route
router.get("/auth/google",passport.authenticate("google",{scope:["profile","email"]}));
router.get("/auth/google/callback", passport.authenticate("google",{failureRedirect:"/signup"}),(req,res)=>{
    res.redirect("/")
});

//login
router.get("/login",userController.loadLogin)
router.post("/login",userController.login)
router.get("/logout",userController.logout)

// forget password
router.get("/forgot-password",profileController.forgetPassPage)
router.post("/forgotPassword",profileController.forgotPassEmailVerify)
router.post("/forgotPassword-otpVerify",profileController.forgotPasswordOTPverify)
router.get("/reset-password",profileController.resetPasswordPage)
router.post("/resend-forgot-otp",profileController.forgotPassResendOtp)
router.post("/reset-password",profileController.resetPassword)

// Product details
router.get("/productDetails",userAuth,productController.productDetails)

// Profile management
router.get("/userProfile",userAuth,profileController.profile);

// change email
router.get("/changeEmail", userAuth,profileController.changeEmail)
router.post("/changeEmail",userAuth,profileController.verifyEmail)
router.post("/verify-email-otp",userAuth,profileController.verifyEmailOtp)
router.post("/updateEmail",userAuth,profileController.updateEmail)

// change password
router.get("/changePassword",userAuth,profileController.changePassword)
router.post("/changePassword",userAuth,profileController.changePasswordVerify)
router.post("/verify-pass-otp",userAuth,profileController.verifyPassOtp)
router.post("/updatePassword",userAuth,profileController.updatePassword)

// Address management
router.get("/addAddress",userAuth,profileController.addressPage)
router.post("/addAddress",userAuth,profileController.addAddress)
router.get("/editAddress",userAuth,profileController.editAddress)
router.post("/editAddress",userAuth,profileController.updateAddress)
router.get("/deleteAddress",userAuth,profileController.deleteAddress)

// cart management
router.get("/cart",userAuth,cartController.cartPage)
router.post("/addToCart",userAuth,cartController.addToCart)
router.get("/removeFromCart",userAuth,cartController.removeProduct)
router.post("/updateCartQuantity",userAuth,cartController.updateCartQuantity)

//checkout management
router.get("/checkOut",userAuth,checkOutController.checkOutPage)
router.post("/placeOrder",userAuth,checkOutController.placeOrder)

// order management
router.get("/orderDetails/:orderId",userAuth,orderController.orderDetails)
router.post("/orderCancel/:orderId",userAuth,orderController.orderCancel)





module.exports = router;