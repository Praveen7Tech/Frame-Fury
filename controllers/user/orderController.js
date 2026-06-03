const Order = require("../../models/orderSchema")
const Address = require("../../models/addressSchema");
const Product = require("../../models/productSchema");
const Wallet = require("../../models/walletSchema")
const STATUS_CODE = require("../../constants/statuscode");
const MESSAGES = require("../../constants/messages");
const { v4: uuidv4 } = require("uuid")

const orderDetails = async (req, res) => {
    try {
        const user = req.session.user
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId)
            .populate("items.productId", "productName productImage").exec();
        console.log("orrrd", order)


        res.render("order-details", { user, order })
    } catch (error) {
        console.error("Error in showing order details", error);
        res.redirect("/pageNotFound")
    }
}


const orderCancel = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const { cancelReason } = req.body;
        const userId = req.session.user;
        const order = await Order.findById(orderId);
        const wallet = await Wallet.findOne({ userId })
        console.log("wallet : ", wallet);


        if (order.orderStatus === "Pending" || order.orderStatus === "Confirmed") {

            const promiseAll = order.items.map(async (item) => {
                const product = await Product.findById(item.productId);
                if (product) {
                    product.quantity += item.quantity
                    await product.save()
                }
            })


            await Promise.all(promiseAll);

            order.orderStatus = "Cancelled"
            order.cancelReason = cancelReason;
            await order.save();

            console.log("order cancelled succussfully...");

            res.status(STATUS_CODE.OK).json({ success: true, message: MESSAGES.ORDER_CANCELLED_SUCCESS })

            const transactionId = uuidv4();

            if (order.paymentMethod === "wallet" || order.paymentMethod === "Online") {
                wallet.balance += order.total
                wallet.refundHistory.push({
                    refundId: transactionId,
                    orderId: order._id,
                    amount: order.total,
                    date: new Date()
                })
                await wallet.save()
                console.log("wallet updated successfully")
            }
        } else if (order.orderStatus === "Shipped") {
            res.status(STATUS_CODE.BAD_REQUEST).json({ success: false, message: MESSAGES.ORDER_CANNOT_CANCEL })
        }

    } catch (error) {
        console.error("Error in cancelling order", error);
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: MESSAGES.SERVER_ERROR_ALT })
    }
}


const ReturnOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const userId = req.session.user
        console.log("od id", orderId)
        const order = await Order.findById(orderId)
        const wallet = await Wallet.findOne({ userId })

        const deliverDate = order.deleiverdDate;
        const currentDate = new Date()
        const expectedDate = new Date(deliverDate);
        expectedDate.setDate(expectedDate.getDate() + 10)

        // console.log("deliver date ",deliverDate );
        // console.log("current date ",currentDate );
        // console.log("expectedDat ",expectedDate );

        const transactionId = uuidv4();


        if (currentDate <= expectedDate) {
            res.status(STATUS_CODE.OK).json({ success: true, message: MESSAGES.RETURN_REQUEST_CONFIRMED })

            order.orderStatus = "Returned"
            await order.save()
            console.log("Return Order Request Success.")

            // refund money to wallet
            if (order.paymentMethod === "wallet" || order.paymentMethod === "Online" || order.paymentMethod === "COD") {
                wallet.balance += order.total
                wallet.refundHistory.push({
                    refundId: transactionId,
                    orderId: order._id,
                    amount: order.total,
                    date: new Date()
                })

                await wallet.save()
            }

            console.log("Wallet updated successfully");

        }
        else {
            res.status(STATUS_CODE.BAD_REQUEST).json({ success: false, message: MESSAGES.RETURN_PERIOD_EXPIRED })
        }
    } catch (error) {
        console.error("Error in Return ORder Request..", error);
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: MESSAGES.SERVER_ERROR_ALT })
    }
}


const orderSuccess = async (req, res) => {
    try {
        const orderId = req.query.orderId
        const user = req.session.user
        console.log("user success", user, orderId)
        res.render("order-success", { user, orderId })
    } catch (error) {
        console.log("Error in showing order success page", error)
    }
}


const orderFailure = async (req, res) => {
    try {
        const user = req.session.user;
        const orderId = req.query.orderId
        res.render("order-failure", { user, orderId })
    } catch (error) {
        console.error("Error in showing order failure page", error)
    }
}



module.exports = {
    orderDetails,
    orderCancel,
    ReturnOrder,
    orderSuccess,
    orderFailure
}