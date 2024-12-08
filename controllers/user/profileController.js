const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema")
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const session = require("express-session")
dotenv.config()


const profile = async(req,res)=>{
    try {
        const userId = req.session.user
        const userData = await User.findById(userId)
        const addressData = await Address.findOne({userId:userId})
        res.render("profile",{user:userData , userAddress:addressData})
    } catch (error) {
        console.error("Error in fetching user profile",error);
        res.redirect("/pageNotFound")   
    }
}

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email,otp) {
    try {
        const transporter = nodemailer.createTransport({
            service:'gmail',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }           
        })

        const options = {
            from: process.env.NODEMAILER_EMAIL,
            to:email,
            subject:"OTP for password rest",
            text:`Your OTP is :${otp}`,
            html: `<b> Your OTP : ${otp} </b>`,
        }

        const info = await transporter.sendMail(options);
        console.log('Email sended :',info.messageId);
        return true;

    } catch (error) {
        console.error("Error in sending Email",error);
        return false;
    }
}

// forget password page
const forgetPassPage = async(req,res)=>{
    try {
        res.render("forget-pass-emailVerify")
    } catch (error) {
        res.render("/login")
    }
}

const forgotPassEmailVerify = async(req,res)=>{
    try {
        const {email} = req.body;
        const findUser = await User.findOne({email:email});

        if(findUser){
            const otp = generateOtp();
            const sendMail = await sendVerificationEmail(email,otp)

            if(sendMail){
                req.session.userOtp = otp;
                req.session.email = email;

                res.render("forgotPass-otpVerify");
                console.log("Forget Pass OTP :",otp);
                
            }else{
                res.json({success:false,message:"Failed to send OTP, Please try again!"})
            }
        }else{
            res.render("forget-pass-emailVerify",{message:"Entered Email not exist"})
        }
    } catch (error) {
        res.redirect("/login")
    }
}


const forgotPasswordOTPverify = async(req,res)=>{
    try {
        const enteredOtp = req.body.otp;
        console.log("entered otp ",enteredOtp);
        console.log("sesiion otp ",req.session.userOtp);
        
        
        if(enteredOtp === req.session.userOtp){
            res.json({success:true,redirectUrl:"/reset-password"})
        }else{
            res.json({success:false,message:"OTP not matching"})
        }
    } catch (error) {
        res.status(500).json({success:false, message:"An Eroor occured, Please try again"})
    }
}


const resetPasswordPage = async(req,res)=>{
    try {
        res.render("reset-password")
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const forgotPassResendOtp = async(req,res)=>{
    try {
        const otp = generateOtp()
        req.session.userOtp = otp;
        const email = req.session.email

        const sendMail = await sendVerificationEmail(email,otp)
        if(sendMail){
            console.log("Resend OTP :",otp);
            res.status(200).json({success:true,message:"OTP Resend Successfully"})
        }else{
            res.status(500).json({success:false, message:"Failed to Resend OTP, please try again later!"})
        }
    } catch (error) {
        console.error("Error Re sending OTP",error);
        res.status(500).json({success:false,message:"Internal Server Error, Please try again!"})
    }
}

const securePassword = async(newPass)=>{
    try {
        const passwordHash = await bcrypt.hash(newPass,10);
        return passwordHash
    } catch (error) {
        
    }
}

const resetPassword = async(req,res)=>{
    try {
        const {newPass, confirmPass} =req.body;
        const email = req.session.email;

        if(newPass === confirmPass){
            const passwordHash = await securePassword(newPass);

            await User.updateOne(
                {email:email},
                {$set:{password:passwordHash}}
            )
            res.redirect("/login")
        }else{
            res.render("reset-password",{message:"Password do not match"})
        }
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}



const changeEmail = async(req,res)=>{
    try {
        res.render("change-email")
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}


const verifyEmail = async(req,res)=>{
    try {
        const { email} = req.body;
        const userId = req.session.user
        //console.log("userid ",userId);
        
        const currentUser = await User.findById(userId)
        ///console.log("current user ",currentUser);
        
        if(email === currentUser.email){
            const otp= generateOtp()
            const sendMail = await sendVerificationEmail(email,otp);

            if(sendMail){
                req.session.userOtp = otp
                req.session.userData = req.body
                req.session.email = email

                res.render("verify-email-otp");
                console.log("Email send :",email);
                console.log("OTP send : ",otp);
                  
            }else{
                res.json("email-error")
            }
        }else{
            res.render("change-email",{message:"The entered email does not match your current email address."})
        }
    } catch (error) {
        console.error("Error verifying email:", error);
        res.redirect("/pageNotFound")
    }
}

const verifyEmailOtp = async(req,res)=>{
    try {
        const enteredOtp = req.body.otp;
        //console.log("entered otp ",enteredOtp);
        if(enteredOtp === req.session.userOtp){
            //console.log("session otp ",req.session.userOtp);           
            req.session.userData = req.body.userData;
            console.log("data",req.session.userData);
            
            res.render("new-email",{userData : req.session.userData})
        }
        else{
            res.render("verify-email-otp",
                {userData:req.session.userData,
                message:"Entered OTP is not matching"
                })
        }
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const updateEmail = async(req,res)=>{
    try {
        const newEmail = req.body.newEmail;
        const userId = req.session.user;
        await User.findOneAndUpdate(userId,{email:newEmail})
        res.redirect("/userProfile")
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const changePassword = async(req,res)=>{
    try {
        res.render("change-password")
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const changePasswordVerify = async(req,res)=>{
    try {
        const {email} = req.body;
        const userId = req.session.user;
        const curentUser = await User.findById(userId);

        if(email === curentUser.email){
            const otp = generateOtp()
            const sendMail = await sendVerificationEmail(email,otp)


            if(sendMail){
                req.session.userOtp = otp;
                req.session.userData = req.body;
                req.session.email = email

                res.render("verify-pass-otp")
                console.log("Email send :",email);
                console.log("OTP send : ",otp);
            }else{
                res.json("Eroor in password change")
            }
        }else{
            res.render("change-password",{message:"The entered email doesn't match your current email."})
        }
       
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const verifyPassOtp = async(req,res)=>{
    try {
        const enteredOtp = req.body.otp;
        const userOtp = req.session.userOtp;
        //console.log("body otp :",enteredOtp);
        //console.log("session otp ",userOtp);
        
        if(enteredOtp == userOtp){
            req.session.userData = req.body.userData;

            res.render("new-password",{userData : req.session.userData})
        }
        else{
            res.render("verify-pass-otp",{userData:req.session.userData, message:"Entered otp is not matching"})
        }
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}


const updatePassword = async(req,res)=>{
    try {
        const {newPass, confirmPass} = req.body;
        const email =req.session.email;

        if(newPass === confirmPass){
            const passwordHash = await securePassword(newPass);

            await User.updateOne(
                {email:email},
                {$set:{password:passwordHash}}
            )
            res.redirect("/userProfile")
        }else{
            res.render("new-password",{message:"Password do not match"})
        }
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}


const addressPage = async(req,res)=>{
    try {
        const user = req.session.user;
        res.render("add-address",{user:user})
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const addAddress = async(req,res)=>{
    try {
        const {
            addressType,
            name,
            city,
            landMark,
            state,
            pincode,
            phone,
            altPhone
        } = req.body

        const userId = req.session.user;
        const userData = await User.findOne({_id:userId});
        const userAddress = await Address.findOne({userId:userData._id});
         
        if(!userAddress){
            const newAddress = new Address({
                userId:userData._id,
                address:[{addressType,name,city,landMark,state,pincode,phone,altPhone}]
            })

            await newAddress.save();
        }else{
            userAddress.address.push({addressType,name,city,landMark,state,pincode,phone,altPhone});
            await userAddress.save()
        }
        console.log("address : ",userAddress);
        
        res.redirect("/userProfile")
    } catch (error) {
        console.error(("Error in address adding"));
        res.redirect("/pageNotFound")
    }
}


const editAddress = async(req,res)=>{
    try {
        const addressId = req.query.id;
        const user = req.session.user;
        const userAddress = await Address.findOne({"address._id":addressId});

        const currentAddress =userAddress.address.find(address => address._id.toString() === addressId);

        if(!currentAddress){
            return res.status(404).send("Address not found!")
        }

        res.render("edit-address",{address:currentAddress, user:user})

        

    } catch (error) {
        console.error("Error in editing address",error);
        res.redirect("/pageNotFound")
        
    }
}

const updateAddress = async(req,res)=>{
    try {
        const data = req.body;
        const addressId = req.query.id;
        const user = req.session.user;
        console.log("address id -",addressId)

        const findAddress = await Address.findOne({"address._id":addressId});
        console.log("address -",findAddress);
        
        if(!findAddress){
            return res.redirect("/pageNotFound")
        }
        await Address.updateOne(
            {"address._id":addressId},
            {$set:{"address.$":{
                _id:addressId,
                addressType:data.addressType,
                name:data.name.join(''),
                city:data.landMark,
                landMark:data.landMark,
                state:data.state,
                pincode:data.pincode,
                phone:data.phone,
                altPhone:data.altPhone
            }}}
        )

        res.redirect("/userProfile")
    } catch (error) {
        console.error(("Error in updating Address",error));
        res.redirect("/pageNotFound")
    }
}


module.exports ={
    profile,
    changeEmail,
    verifyEmail,
    verifyEmailOtp,
    updateEmail,
    changePassword,
    changePasswordVerify,
    verifyPassOtp,
    updatePassword,
    forgetPassPage,
    forgotPassEmailVerify,
    forgotPasswordOTPverify,
    resetPasswordPage,
    forgotPassResendOtp,
    resetPassword,
    addressPage,
    addAddress,
    editAddress,
    updateAddress
}