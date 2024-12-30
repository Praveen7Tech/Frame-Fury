const Order= require("../../models/orderSchema")
const Wallet = require("../../models/walletSchema")

const walletPage = async(req,res)=>{
    try {
        const user = req.session.user
        const order = await Order.find({paymentMethod:"Online"}).sort({createdAt:-1}).lean()

        const refundOrder = await Order.find({orderStatus:"Cancelled"}).sort({createdAt:-1}).lean()

        console.log("w ord",refundOrder)

        res.render("wallet",{user,order,refundOrder})
    } catch (error) {
        console.error("Error in loading wallet",error);
        res.redirect("/pageNotFound")
    }
}




module.exports ={
    walletPage
}