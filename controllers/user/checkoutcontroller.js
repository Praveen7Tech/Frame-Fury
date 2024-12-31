
const User = require("../../models/userSchema");
const Cart = require("../../models/cartSchema");
const Order = require("../../models/orderSchema")
const Address = require("../../models/addressSchema");
const Category = require("../../models/categorySchema");
const Coupon = require("../../models/coupenSchema");
const Wallet = require("../../models/walletSchema")

const {v4: uuidv4} = require("uuid")

const crypto = require("crypto")

const dotenv = require("dotenv")
dotenv.config()

const Razorpay = require("razorpay")


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
        const { selectedAddress, paymentMethod, deliveryMethod, couponCode, } = req.body;
        const userId = req.session.user;
        console.log(" req body _",req.body);
        

        // Fetch the selected address details
        const userAddress = await Address.findOne(
            { userId, "address._id": selectedAddress },
            { "address.$": 1 }  // Fetch only the matched address
        );

        if (!userAddress) {
            return res.status(400).json({ success: false, message: "Invalid address selected" });
        }

        // Extract address details
        const addressDetails = userAddress.address[0]; 


        const cart = await Cart.findOne({ userId }).populate("items.productId");
        const category = await Category.find({ isListed: true });
        const listedCategory = category.map(category => category._id.toString());

        const findProduct = cart.items.filter(item => {
            const product = item.productId;
            return product.isBlocked === false && listedCategory.includes(product.category.toString());
        });

        if (!findProduct || findProduct.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }

        const subTotal = findProduct.reduce((sum, item) => sum + item.totalPrice, 0);

        let discount =0
       if(couponCode){
        const coupon = await Coupon.findOne({name:couponCode, isList:true});
        if(coupon){
            discount = coupon.offerPrice
        }
       }
        
       const deliveryCharge = deliveryMethod === "fast" ? 80 : 0;
        
       const total = subTotal - discount + deliveryCharge

        const order = new Order({
            userId,
            address: addressDetails, 
            deliveryCharge,
            deliveryMethod,
            subTotal,
            total,
            couponDiscount:discount,
            paymentMethod,
            couponCode,
            items: findProduct
        });

        await order.save();
        await Cart.findOneAndUpdate({ userId }, { items: [] });

        res.json({ success: true, orderId: order._id ,discount});
        console.log("Order placed successfully");
    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).json({
            success: false,
            message: "Failed to place the order",
            error: error.message,
        });
    }
};

// craetting a razorpay instance
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY, 
    key_secret: process.env.RAZORPAY_SECRET_KEY, 
});

const razorPayOrder = async (req, res) => {
    try {
        const { totalAmount } = req.body;
        console.log("Total Amount: ", totalAmount);

        const options = {
            amount: totalAmount * 100, 
            currency: "INR",
        };

        const order = await razorpayInstance.orders.create(options);

        res.json({
            success: true,
            orderId: order.id, 
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_ID_KEY,
        });
    } catch (error) {
        console.error("Error in creating Razorpay Order:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create Razorpay order.",
            error: error.message,
        });
    }
};


const verifyRazorPayOrder = async(req,res)=>{
    try {
        const {selectedAddress,paymentMethod,deliveryMethod,couponCode,  orderId, paymentId,razorpaySignature} = req.body;

        const userId = req.session.user;
        //console.log(" req body _",req.body);
        

        // Fetch the selected address details
        const userAddress = await Address.findOne(
            { userId, "address._id": selectedAddress },
            { "address.$": 1 }  // Fetch only the matched address
        );

        if (!userAddress) {
            return res.status(400).json({ success: false, message: "Invalid address selected" });
        }

        // Extract address details
        const addressDetails = userAddress.address[0]; 


        const cart = await Cart.findOne({ userId }).populate("items.productId");
        const category = await Category.find({ isListed: true });
        const listedCategory = category.map(category => category._id.toString());

        const findProduct = cart.items.filter(item => {
            const product = item.productId;
            return product.isBlocked === false && listedCategory.includes(product.category.toString());
        });

        if (!findProduct || findProduct.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }

        const subTotal = findProduct.reduce((sum, item) => sum + item.totalPrice, 0);

        let discount =0
       if(couponCode){
        const coupon = await Coupon.findOne({name:couponCode, isList:true});
        if(coupon){
            discount = coupon.offerPrice
        }
       }
        
       const deliveryCharge = deliveryMethod === "fast" ? 80 : 0;
        
       const total = subTotal - discount + deliveryCharge


       // check the signature is valid, means payment is authentic
        const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
        .update(`${orderId}|${paymentId}`)
        .digest("hex")

        console.log("compare ",generatedSignature , razorpaySignature)

        if(generatedSignature === razorpaySignature){

            const order = new Order({
                userId,
                address: addressDetails, 
                deliveryCharge,
                deliveryMethod,
                subTotal,
                total,
                couponDiscount:discount,
                paymentMethod,
                couponCode,
                items: findProduct,
                
                orderId,                       //razorpay implimentation
                paymentId,
                paymentStatus:"Paid",

            });

            await order.save()

            await Cart.findOneAndUpdate({ userId }, { items: [] });

            res.json({ success: true, orderId: order._id ,discount});
            console.log("Order placed successfully");

        }else{
            res.status(400).json({success:false,message:"Payment Verification Failed..!"})
        }
    } catch (error) {
        console.error("Error verifying Razorpay payment:", error);
        res.status(500).json({ success: false, message: "Failed to verify payment" });
    }
}

const placeOrderWallet = async (req, res) => {
    try {
        const { selectedAddress, paymentMethod, deliveryMethod, couponCode, totalAmount } = req.body;
        const userId = req.session.user;

        console.log("body--", req.body);
        console.log("user id--", userId);

        // Check wallet balance
        const wallet = await Wallet.findOne({ userId });
        console.log("wallet", wallet);
        if (!wallet || wallet.balance < totalAmount) {
            return res.status(400).json({ success: false, message: "Insufficient Balance in Your Wallet" });
        }

        // Validate selected address
        const userAddress = await Address.findOne(
            { userId, "address._id": selectedAddress },
            { "address.$": 1 } // Fetch only the matched address
        );

        if (!userAddress) {
            return res.status(400).json({ success: false, message: "Invalid address selected" });
        }

        // Extract address details
        const addressDetails = userAddress.address[0];

        // Fetch user's cart
        const cart = await Cart.findOne({ userId }).populate("items.productId");
        const category = await Category.find({ isListed: true });
        const listedCategory = category.map(category => category._id.toString());

        const findProduct = cart.items.filter(item => {
            const product = item.productId;
            return product.isBlocked === false && listedCategory.includes(product.category.toString());
        });

        if (!findProduct || findProduct.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }

        // Calculate totals
        const subTotal = findProduct.reduce((sum, item) => sum + item.totalPrice, 0);
        let discount = 0;

        if (couponCode) {
            const coupon = await Coupon.findOne({ name: couponCode, isList: true });
            if (coupon) {
                discount = coupon.offerPrice;
            }
        }

        const deliveryCharge = deliveryMethod === "fast" ? 80 : 0;
        const total = subTotal - discount + deliveryCharge;

        // Create new order
        const order = new Order({
            userId,
            address: addressDetails,
            deliveryCharge,
            deliveryMethod,
            subTotal,
            total,
            couponDiscount: discount,
            paymentMethod,
            couponCode,
            items: findProduct
        });

        await order.save();
        await Cart.findOneAndUpdate({ userId }, { items: [] });

        // Update wallet
        const transactionId = uuidv4();
        wallet.balance -= total;
        wallet.onlinePurchase.push({
            paymentId: transactionId,
            amount: total,
            date: new Date()
        });
        await wallet.save();

        console.log("Wallet updated successfully");
        console.log("Order placed successfully");

        // Send response
        return res.json({ success: true, orderId: order._id });
        
        
    } catch (error) {
        console.error("Error placing order:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to place the order",
            error: error.message
        });
    }
};


module.exports ={
    checkOutPage,
    placeOrder,
    razorPayOrder,
    verifyRazorPayOrder,
    placeOrderWallet
}