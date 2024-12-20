
const User = require("../../models/userSchema");
const Cart = require("../../models/cartSchema");
const Order = require("../../models/orderSchema")
const Address = require("../../models/addressSchema");
const Category = require("../../models/categorySchema")


const checkOutPage = async(req,res)=>{
    try {
        const userId = req.session.user;
        const cart = await Cart.findOne({userId}).populate("items.productId")
        const userAddress = await Address.findOne({userId});
        const categories = await Category.find({isListed:true})
        const listedCategory = categories.map(category=> category._id.toString())

        const findProduct = cart.items.filter(item=>{
            const product = item.productId
            return (product.isBlocked === false && listedCategory.includes(product.category.toString()))
        });
        
        const subTotal = findProduct.reduce((sum, items)=> sum + items.totalPrice ,0);
        let shiipingCost =0
        
        const total = subTotal + shiipingCost;

        

        res.render("checkout",{
            user:userId,
            cart:findProduct ? findProduct:[],
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
        const { selectedAddress, paymentMethod, deliveryMethod } = req.body;
        const userId = req.session.user;
        
        const userAddress = await Address.findOne(
            { userId, "address._id": selectedAddress },
            { "address.$": 1 }  
        );

        if (!userAddress) {
            return res.status(400).json({ success: false, message: "Invalid address selected" });
        }

        const cart = await Cart.findOne({ userId }).populate("items.productId");
        const category = await Category.find({isListed:true});
        const listedCategory = category.map(category=> category._id.toString());

        const findProduct = cart.items.filter(item=>{
            const product = item.productId;
            return ( product.isBlocked===false && listedCategory.includes(product.category.toString()))
        });

        if (!findProduct || findProduct.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }

        const subTotal = findProduct.reduce((sum, item) => sum + item.totalPrice, 0);

        let deliveryCharge =0;
        if(deliveryMethod === "fast"){
            deliveryCharge = 80;
        }
        const total = subTotal + deliveryCharge
        console.log("total-",total);
        

        const order = new Order({
            userId,
            addressId: selectedAddress,
            deliveryCharge,
            deliveryMethod,
            subTotal,
            total,
            paymentMethod,
            items: findProduct
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