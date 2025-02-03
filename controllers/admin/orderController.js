const Order = require("../../models/orderSchema")
const Address = require("../../models/addressSchema")

const orderList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || ""; // Capture search input

        let query = {};

        if (search) {
            query = { orderId: { $regex: search, $options: "i" } }; 
        }

        const order = await Order.find(query)
            .populate("userId", "name email")
            .populate("items.productId", "productName productImage")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();

        const totalOrder = search
            ? await Order.countDocuments(query) // Count filtered results if searching
            : await Order.countDocuments(); // Count all documents otherwise

        const totalPages = Math.ceil(totalOrder / limit);

        res.render("orderList", { 
            order, 
            totalPages, 
            currentPage: page,
            search 
        });
    } catch (error) {
        console.error("Error in load order page", error);
        res.redirect("/pageerror");
    }
};



const orderView = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId)
            .populate("userId", "name email")
            .populate("items.productId", "productName productImage")
            .exec();

        res.render("order-view", { order });
    } catch (error) {
        console.error("Error fetching order details:", error);
        res.redirect("/admin/pageerror");
    }
};


const EditStatusPage = async (req, res) => {
    try {
        const orderId = req.params.orderId
        const order = await Order.findById(orderId)
            .populate("userId", "name email")
            .populate("items.productId", "productName productImage")
            .exec()
        //console.log("id : ",orderId);

        res.render("order-statusEdit", { order, orderStatuses })
    } catch (error) {
        console.error("Error in update order status", error);
        res.redirect("/admin/pageerror")
    }
}

const orderStatuses = {
    Pending: ["Confirmed", "Cancelled"],
    Confirmed: ["Shipped", "Cancelled"],
    Shipped: ["Deliverd"],
    Deliverd: [],
    Cancelled: []
}

const EditStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        const order = await Order.findById(orderId);

        console.log("order id : ", orderId);
        console.log("status : ", status);

        const currentStatus = order.orderStatus;
        const newStatus = orderStatuses[currentStatus];

        if (!newStatus) {
            return res.status(400).send(`Not possible to change the status from ${currentStatus}, to ${status}`)
        }


        order.orderStatus = status;
        await order.save();

        if (order.orderStatus === "Shipped") {
            order.deleiverdDate = Date.now()

            await order.save()
        }

        res.redirect("/admin/orderList")
    } catch (error) {
        console.error("Error in updating order status.", error);
        res.redirect("/admin/pageerror")
    }
}







module.exports = {
    orderList,
    orderView,
    EditStatusPage,
    EditStatus,
}