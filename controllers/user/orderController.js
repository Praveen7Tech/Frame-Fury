const Order = require("../../models/orderSchema")
const Address = require("../../models/addressSchema");
const Product = require("../../models/productSchema");
const Wallet = require("../../models/walletSchema")
const {v4 :uuidv4} = require("uuid")

const orderDetails = async(req,res)=>{
    try {
        const user =req.session.user
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId)
        .populate("items.productId","productName productImage").exec();
        console.log("orrrd",order)


        res.render("order-details",{user,order})
    } catch (error) {
        console.error("Error in showing order details",error);
        res.redirect("/pageNotFound")
    }
}


const orderCancel = async(req,res)=>{
    try {
        const orderId = req.params.orderId;
        const userId = req.session.user;
        const order = await Order.findById(orderId);
        const wallet = await Wallet.findOne({userId})
        //console.log("order : ",order);
        

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

            const transactionId = uuidv4();

            if(order.paymentMethod ==="wallet" || order.paymentMethod ==="Online"){
                wallet.balance +=order.total
                wallet.refundHistory.push({
                    refundId:transactionId,
                    orderId:order._id,
                    amount:order.total,
                    date:new Date()
                })
                await wallet.save()
                console.log("wallet updated successfully")
            }
        }else if(order.orderStatus === "Shipped"){
            res.status(400).json({success:false,message:"Order Can't Cancel, Shipping started.."})
        }

    } catch (error) {
        console.error("Error in cancelling order",error);
        res.status(500).json({message:"Server error..!"})
    }
}


const ReturnOrder = async(req,res)=>{
    try {
        const orderId = req.params.orderId;
        const userId = req.session.user
        console.log("od id",orderId)
        const order = await Order.findById(orderId)
        const wallet = await Wallet.findOne({userId})

        const deliverDate = order.deleiverdDate;
        const currentDate = new Date()
        const expectedDate = new Date(deliverDate);
        expectedDate.setDate(expectedDate.getDate()+10)

        // console.log("deliver date ",deliverDate );
        // console.log("current date ",currentDate );
        // console.log("expectedDat ",expectedDate );

        const transactionId = uuidv4();
        

        if(currentDate <= expectedDate){
            res.status(200).json({success:true,message:"Return Order Request Confirmed..!"})

            order.orderStatus = "Returned"
            await order.save()
            console.log("Return Order Request Success.")

            // refund money to wallet
            if(order.paymentMethod === "wallet" || order.paymentMethod ==="Online"){
                wallet.balance += order.total
                wallet.refundHistory.push({
                    refundId:transactionId,
                    orderId:order._id,
                    amount:order.total,
                    date:new Date()
                })
    
                await wallet.save()
            }

            console.log("Wallet updated successfully");           
            
        }
        else{
            res.status(400).json({success:false,message:"Unfortunately The Return Period Has Expired..!"})
        }
    } catch (error) {
        console.error("Error in Return ORder Request..",error);
        res.status(500).json({message:"Server Error..!"})
    }
}




module.exports ={
    orderDetails,
    orderCancel,
    ReturnOrder
}