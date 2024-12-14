const Order = require("../../models/orderSchema")
const Address = require("../../models/addressSchema")

const orderList = async(req,res)=>{
    try {
        const order = await Order.find().populate("userId", 'name email').populate("addressId","address").populate("items.productId","productName productImage").exec()
        
        res.render("orderList",{order})
    } catch (error) {
        res.redirect("/pageerror")
    }
}


const orderView = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId)
            .populate("userId", "name email")
            .populate("items.productId", "productName productImage")
            .exec();

        const shippingAddress = await Address.findOne(
            { "address._id": order.addressId },
            { "address.$": 1 }
        );

        // Extract the address
        const addressDetails = shippingAddress?.address[0];

        console.log("Order ID:", orderId);
        console.log("Order:", order);
        console.log("Shipping Address:", addressDetails);

        res.render("order-view", { order, addressDetails });
    } catch (error) {
        console.error("Error fetching order details:", error);
        res.redirect("/pageerror");
    }
};





module.exports ={
    orderList,
    orderView
}