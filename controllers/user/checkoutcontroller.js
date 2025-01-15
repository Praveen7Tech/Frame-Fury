
const User = require("../../models/userSchema");
const Cart = require("../../models/cartSchema");
const Order = require("../../models/orderSchema")
const Address = require("../../models/addressSchema");
const Category = require("../../models/categorySchema");
const Coupon = require("../../models/coupenSchema");
const Wallet = require("../../models/walletSchema");
const axios = require("axios")

const {v4: uuidv4} = require("uuid")

const crypto = require("crypto")

const dotenv = require("dotenv")
dotenv.config()

const Razorpay = require("razorpay");
const { default: mongoose } = require("mongoose");


function generateOrderId(){
  const time = Date.now().toString()
  const randomNumber = Math.floor(Math.random() * 100000).toString();

  return `ORD-${time}-${randomNumber}`
}

const checkOutPage = async(req,res)=>{
    try {
        const userId = req.session.user;
        const cart = await Cart.findOne({userId}).populate("items.productId")
        const userAddress = await Address.findOne({userId});
        const categories = await Category.find({isListed:true})
        const coupon = await Coupon.find({isList:true})

        const listedCategory = categories.map(category=> category._id.toString())

        const findProduct = cart.items.filter(item=>{
            const product = item.productId
            return (product.isBlocked === false && listedCategory.includes(product.category.toString()))
        });

        if(!findProduct || findProduct.length === 0){
          return res.redirect('/cart');
        }
        
        const subTotal = findProduct.reduce((sum, items)=> sum + items.totalPrice ,0);
        let shiipingCost =0
        
        const total = subTotal + shiipingCost;

        res.render("checkout",{
            user:userId,
            cart:findProduct,
            addresses: userAddress ? userAddress.address:[],
            subTotal,
            total,
            coupon
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
    

        // if (!findProduct || findProduct.length === 0) {
        //     return res.status(400).json({ success: false, message: "Cart is empty" });
        // }

        const subTotal = findProduct.reduce((sum, item) => sum + item.totalPrice, 0);

       let discount =0
       if(couponCode){
        const coupon = await Coupon.findOne({name:couponCode, isList:true});
        if(coupon){
            discount = coupon.offerPrice
        }
        coupon.UsageLimit -= 1;
        await coupon.save()
       }

       //Total product Offer
       const value = findProduct.map(item => item.productId.offerAmount * item.quantity);
       const productOfferTotal = value.reduce((sum, value) => sum + value ,0)

       console.log("off amt",value, "qq",productOfferTotal)
        
       const deliveryCharge = deliveryMethod === "fast" ? 80 : 0;
        
       const total = subTotal - discount + deliveryCharge

       //maximum price limit for COD 
       if(total >= 15000){
          return res.status(400).json({success:false,message:"Cash On Delivery Option Only Available, at Maximum Purchase of ₹ 15000, Please use another payment option..!"})
       }

       const orderId = generateOrderId()

        const order = new Order({
            orderId:orderId,
            userId,
            address: addressDetails, 
            deliveryCharge,
            deliveryMethod,
            subTotal:Math.floor(subTotal),
            total:Math.floor(total),
            couponDiscount:discount,
            paymentMethod,
            couponCode,
            items: findProduct,
            productOfferTotal
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

// creating a razorpay instance
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


const verifyRazorPayOrder = async (req, res) => {
  try {
    const { selectedAddress,paymentMethod,deliveryMethod,couponCode,orderId,paymentId,razorpaySignature,id} = req.body;
    console.log("body-",req.body)
    const userId = req.session.user;

    const existingOrder = await Order.findById(id)
    console.log("existing:",existingOrder)

    //checking if there is any failed order based on this id proceed that
    if(existingOrder && existingOrder.paymentStatus === "Failed"){
      console.log("start crypto..")
        
      const generatedSignature = crypto
      .createHmac("sha256",process.env.RAZORPAY_SECRET_KEY)
      .update(`${orderId}|${paymentId || ''}`)
      .digest("hex")

      if(paymentId && generatedSignature === razorpaySignature){
        const razorpayResponse = await axios.get(
          `https://api.razorpay.com/v1/payments/${paymentId}`,
          {
            auth: {
              username: process.env.RAZORPAY_ID_KEY,
              password: process.env.RAZORPAY_SECRET_KEY,
            },
          }
        );
  
        const paymentStatus = razorpayResponse.data.status
        console.log("pay status",paymentStatus)
  
        if(paymentStatus === "captured"){
  
          existingOrder.paymentStatus = "Paid";
          existingOrder.paymentId = paymentId;
  
          await existingOrder.save();
  
           // Clear the user's cart
          //await Cart.findOneAndUpdate({ userId }, { items: [] });
  
          console.log("Re payment successfull")
          return res.json({success:true,message:"Payment Successful Existing order hs been Updated.",orderId:existingOrder._id})
        }
      }else{
        return res.status(400).json({success:false,message:"Invalid signature, or Payment Verification Failed"})
      }
    }

  // THER IS NO FAILED ORDER CREATE NEW ORDER  

    // globally assigned address as empty
    let addressDetails;

    // condition for address format is string or objectId (from payment success function)
    if(typeof selectedAddress === "string" && mongoose.Types.ObjectId.isValid(selectedAddress)){

      const userAddress = await Address.findOne({userId, "address._id":selectedAddress},{"address.$":1})

      if(userAddress && userAddress.address.length > 0){
        addressDetails =userAddress.address[0]
      }
      else{
        throw new Error("Address is Not Found..")
      }

    }
    // condition for address is object (from the repay order)
    else if(typeof selectedAddress === "object" && selectedAddress !== null){

      addressDetails=selectedAddress
    }else{
      throw new Error("Invalid Address Format..")
    }
    

    //  Fetch the cart details
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    const category = await Category.find({ isListed: true });
    const listedCategory = category.map((cat) => cat._id.toString());

    
    const findProduct = cart.items.filter((item) => {
      const product = item.productId;
      return !product.isBlocked && listedCategory.includes(product.category.toString());
    });

    if (!findProduct || findProduct.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const subTotal = findProduct.reduce((sum, item) => sum + item.totalPrice, 0);

    // Apply coupon discount if applicable
    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ name: couponCode, isList: true });
      if (coupon) {
        discount = coupon.offerPrice;
        coupon.UsageLimit -= 1;
        await coupon.save();
      }
    }

    const deliveryCharge = deliveryMethod === "fast" ? 80 : 0;
    const total = subTotal - discount + deliveryCharge;

    const productOfferTotal = findProduct.reduce(
      (sum, item) => sum + item.productId.offerAmount * item.quantity,
      0
    );

    //  Validate the signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(`${orderId}|${paymentId || ''}`)
      .digest("hex");

    let paymentStatusValue = "Pending";

    if (paymentId && generatedSignature === razorpaySignature) {
      //  Fetch payment details from Razorpay API if paymentId is provided
      const razorpayResponse = await axios.get(
        `https://api.razorpay.com/v1/payments/${paymentId}`,
        {
          auth: {
            username: process.env.RAZORPAY_ID_KEY,
            password: process.env.RAZORPAY_SECRET_KEY,
          },
        }
      );

      const paymentStatus = razorpayResponse.data.status;

      if (paymentStatus === "captured") {
        paymentStatusValue = "Paid";
      } else {
        paymentStatusValue = "Failed"; //non-captured status
      }
    } else {
      paymentStatusValue = "Failed"; // no paymentId or signature mismatch
    }

    const createdorderId = generateOrderId()

    const order = new Order({
      orderId:createdorderId,
      userId,
      address: addressDetails,
      deliveryCharge,
      deliveryMethod,
      subTotal: Math.floor(subTotal),
      total: Math.floor(total),
      couponDiscount: discount,
      paymentMethod,
      couponCode,
      items: findProduct,
      productOfferTotal,
      paymentId: paymentId || "N/A",
      paymentStatus: paymentStatusValue,
    });

    await order.save();

    // Handle the cart and response based on payment status
    if (paymentStatusValue === "Paid") {
      await Cart.findOneAndUpdate({ userId }, { items: [] });
      res.json({
        success: true,
        message: "Payment successful! Your order has been placed.",
        orderId: order._id,
        discount,
      });
    } else {
      await Cart.findOneAndUpdate({ userId }, { items: [] });
      res.json({
        success: false,
        message: "Payment failed. Your order has been placed with a Failed status.",
        orderId: order._id,
      });
    }
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    res.status(500).json({ success: false, message: "Failed to verify payment" });
  }
};


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

            coupon.UsageLimit -= 1;
            await coupon.save()
        }

        //Total product offer
       const value = findProduct.map(item => item.productId.offerAmount * item.quantity);
       const productOfferTotal = value.reduce((sum, value) => sum + value ,0)

       console.log("off amt",value, "qq",productOfferTotal)

        const deliveryCharge = deliveryMethod === "fast" ? 80 : 0;
        const total = subTotal - discount + deliveryCharge;

        const orderId = generateOrderId()
        // Create new order
        const order = new Order({
            orderId:orderId,
            userId,
            address: addressDetails,
            deliveryCharge,
            deliveryMethod,
            subTotal:Math.floor(subTotal),
            total:Math.floor(total),
            couponDiscount: discount,
            paymentMethod,
            couponCode,
            items: findProduct,
            productOfferTotal
        });

        await order.save();
        await Cart.findOneAndUpdate({ userId }, { items: [] });

        // Update wallet
        const transactionId = uuidv4();
        wallet.balance -= Math.floor(total);
        wallet.onlinePurchase.push({
            paymentId: transactionId,
            amount: Math.floor(total),
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
    placeOrderWallet,
}