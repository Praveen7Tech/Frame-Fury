const Order = require("../../models/orderSchema")
const Address = require("../../models/addressSchema")

const orderList = async(req,res)=>{
    try {
        const order = await Order.find().populate("userId", 'name email').populate("items.productId","productName productImage").exec()
        
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

        // console.log("Order ID:", orderId);
        // console.log("Order:", order);
        // console.log("Shipping Address:", addressDetails);

        res.render("order-view", { order, addressDetails });
    } catch (error) {
        console.error("Error fetching order details:", error);
        res.redirect("/admin/pageerror");
    }
};


const EditStatusPage = async(req,res)=>{
    try {
        const orderId = req.params.orderId
        const order = await Order.findById(orderId)
        .populate("userId","name email")
        .populate("items.productId","productName productImage")
        .exec()
        //console.log("id : ",orderId);
        
        res.render("order-statusEdit",{order, orderStatuses})
    } catch (error) {
        console.error("Error in update order status",error);
        res.redirect("/admin/pageerror") 
    }
}

const orderStatuses ={
    Pending : ["Confirmed","Cancelled"],
    Confirmed : ["Shipped","Cancelled"],
    Shipped : ["Deliverd"],
    Deliverd : [],
    Cancelled : []
}

const EditStatus = async(req,res)=>{
    try {
        const {orderId, status} = req.body;
        const order = await Order.findById(orderId);

        console.log("order id : ",orderId);
        console.log("status : ",status);

        const currentStatus = order.orderStatus;
        const newStatus = orderStatuses[currentStatus];

        if(!newStatus){
            return res.status(400).send(`Not possible to change the status from ${currentStatus}, to ${status}`)
        }
        

        order.orderStatus =status;
        await order.save();

        res.redirect("/admin/orderList")
    } catch (error) {
        console.error("Error in updating order status.",error);
        res.redirect("/admin/pageerror")
    }
}





module.exports ={
    orderList,
    orderView,
    EditStatusPage,
    EditStatus
}