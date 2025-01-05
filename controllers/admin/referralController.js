const User = require("../../models/userSchema")

const ReferralPage = async(req,res)=>{
    try {
        const users = await User.find({referralCode:{$exists:true,$ne:null}})
        console.log("rf users",users);
        
        res.render("referal-page",{users})
    } catch (error) {
        console.error("Error in Loading referal page",error)
        res.redirect("/pageerror")
    }
}



module.exports ={
    ReferralPage
}