const User = require("../../models/userSchema");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config()


const profile = async(req,res)=>{
    try {
        const userId = req.session.user
        const userData = await User.findById(userId)
        res.render("profile",{user:userData})
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
            subject:"OTP for changing Email address",
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
        console.log("entered otp ",enteredOtp);
        
        if(enteredOtp === req.session.userOtp){
            console.log("session otp ",req.session.userOtp);
            
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

module.exports ={
    profile,
    changeEmail,
    verifyEmail,
    verifyEmailOtp,
    updateEmail
}