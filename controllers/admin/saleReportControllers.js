const Order = require("../../models/orderSchema")

const saleFilter = async(req,res)=>{
    try {
        const {filterType} = req.query
        console.log("fill quey-",filterType);

        const today =new Date()
 
        //filtering based on query
        let dayStart,dayEnd

        switch (filterType) {
            case "daily":
                dayStart=new Date(today.setHours(0,0,0,0));
                dayEnd=new Date(today.setHours(23,59,59,999))
                break;

            case "weekly":
                dayStart=new Date(today.setDate(today.getDate() - today.getDate()));
                dayEnd=new Date(today.setDate(dayStart.getDate() + 6))  
                break;

            case "monthly":
                dayStart=new Date(today.getFullYear(),today.getMonth(),1);
                dayEnd=new Date(today.getFullYear(),today.getMonth() +1,0)
                break;

            case "Yearly":
                dayStart=new Date(today.getFullYear(),0,1);
                dayEnd=new Date(today.getFullYear,11,31)
                break;

            default:
                dayStart=new Date(0);
                dayEnd=new Date()
                break;
        }

        const orders = await Order.find({createdAt:{$gte:dayStart,$lte:dayEnd}}).sort({createdAt:-1})

        // dynamically changing values
        const orderCount = orders.length
        const orderTotal = orders.reduce((sum, order) => sum + order.total ,0)
        const overalDiscount = orders.reduce((sum, order)=> sum + order.productOfferTotal ,0)
        const couponDiscountTotal = orders.reduce((sum, order) => sum + order.couponDiscount ,0)

        res.status(200).json({orders,orderCount,orderTotal,overalDiscount,couponDiscountTotal});
        
    } catch (error) {
        console.error("Error in Sale order filtering",error);
        res.status(500).json({message:'Internal Server Error.'})
    }
}




module.exports = {
    saleFilter
}