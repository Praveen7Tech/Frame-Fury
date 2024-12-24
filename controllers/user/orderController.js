const Order = require("../../models/orderSchema")
const Address = require("../../models/addressSchema");
const Product = require("../../models/productSchema");

const orderDetails = async(req,res)=>{
    try {
        const user =req.session.user
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId)
        .populate("items.productId","productName productImage").exec();


        res.render("order-details",{user,order})
    } catch (error) {
        console.error("Error in showing order details",error);
        res.redirect("/pageNotFound")
    }
}


const orderCancel = async(req,res)=>{
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId);
        console.log("order : ",order);
        

        if(order.orderStatus === "Pending" || order.orderStatus === "Confirmed"){

            const promiseAll =order.items.map(async(item)=>{
                const product =await Product.findById(item.productId);
                if(product){
                    product.quantity += item.quantity
                    await product.save()
                }
            })

            await Promise.all(promiseAll);

            order.orderStatus = "Cancelled"
            await order.save();

            console.log("order cancelled succussfully...");
            
            res.status(200).json({success:true,message:"Order Cancelled successfully"})
        }else if(order.orderStatus === "Shipped"){
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