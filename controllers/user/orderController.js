const Order = require("../../models/orderSchema")
const Address = require("../../models/addressSchema")

const orderDetails = async(req,res)=>{
    try {
        const user =req.session.user
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId)
        .populate("items.productId","productName productImage").exec();

        const shippingAddress = await Address.findOne(
            { "address._id": order.addressId },
            { "address.$": 1 }
        );

        // Extract the address
        const addressDetails = shippingAddress?.address[0];

        res.render("order-details",{user,order,address:addressDetails})
    } catch (error) {
        console.error("Error in showing order details",error);
        res.redirect("/pageNotFound")
    }
}


const orderCancel = async(req,res)=>{
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId);

        if(order.orderStatus === "Pending"){
            order.orderStatus = "Cancelled"
            await order.save();

            console.log("order cancelled succussfully...");
            
            res.status(200).json({success:true,message:"Order Cancelled successfully"})
        }else{
            res.status(400).json({success:false,message:"Order Can't Cancel, Shipping started.."})
        }

    } catch (error) {
        console.error("Error in cancelling order",error);
        res.status(500).json({message:"Server error..!"})
    }
}




module.exports ={
    orderDetails,
    orderCancel
}