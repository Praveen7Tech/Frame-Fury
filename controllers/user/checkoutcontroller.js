
const User = require("../../models/userSchema");
const Cart = require("../../models/cartSchema");
const Order = require("../../models/orderSchema")
const Address = require("../../models/addressSchema");


const checkOutPage = async(req,res)=>{
    try {
        const userId = req.session.user;
        const cart = await Cart.findOne({userId}).populate("items.productId")
        const userAddress = await Address.findOne({userId})

        // console.log("cart-",cart);
        const shiipingCost = 0;
        const subTotal = cart.items.reduce((sum, items)=> sum + items.totalPrice ,0);
        const total = subTotal + shiipingCost;
       
        //console.log("address-",address);
        
        // console.log("subTotal",subTotal);
        // console.log("Total",total)

        res.render("checkout",{
            user:userId,
            cart:cart ? cart.items:[],
            addresses: userAddress ? userAddress.address:[],
            subTotal,
            total
        })
    } catch (error) {
        console.error("Error in showing checkout page",error);
        res.redirect("/pageNotFound")
    }
}

const placeOrder = async (req, res) => {
    try {
        const { selectedAddress, paymentMethod } = req.body;
        const userId = req.session.user;

        const userAddress = await Address.findOne(
            { userId, "address._id": selectedAddress },
            { "address.$": 1 }  
        );

        if (!userAddress) {
            return res.status(400).json({ success: false, message: "Invalid address selected" });
        }
        

        const cart = await Cart.findOne({ userId }).populate("items.productId");
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }

        const subTotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
        const total = subTotal; // Add shippingCost if required

        const order = new Order({
            userId,
            addressId: selectedAddress,
            subTotal,
            total,
            paymentMethod,
            items: cart.items
        });

        await order.save();
        await Cart.findOneAndUpdate({ userId }, { items: [] });

        res.json({ success: true, orderId: order._id });
        console.log("Order placed successfully");
    } catch (error) {
        console.error("Error placing order:",error);
        res.status(500).json({
            success: false,
            message: "Failed to place the order",
            error: error.message,
        });
    }
};



module.exports ={
    checkOutPage,
    placeOrder
}