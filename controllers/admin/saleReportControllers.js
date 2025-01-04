const ExcelJs = require("exceljs")
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


const saleFilterByDate = async(req,res)=>{
    try {
        const {startDate,endDate} = req.query;
        console.log(" g g",startDate,endDate)

        if(!startDate || !endDate){
            return res.status(400).json({message:"Both Dates RE required..!"})
        }

        const start = new Date(startDate)
        const end = new Date(endDate)

        end.setUTCHours(23,59,59,999)

        const orders= await Order.find({createdAt:{$gte:start,$lte:end}})

        const saleCount = orders.length
        const saleTotal = orders.reduce((sum,order)=> sum + order.total ,0)
        const productDiscount = orders.reduce((sum, order)=> sum + order.productOfferTotal ,0);
        const couponDiscount = orders.reduce((sum, order)=> sum + order.couponDiscount ,0)

        res.status(200).json({orders,saleCount,productDiscount,saleTotal,couponDiscount})
    } catch (error) {
        console.error("Error in sale filtering by price..",error);
        res.status(500).json({message:"Internal server Error...!"})
    }
}


const downloadReport = async(req,res)=>{
    try {
        const {saleCount,totalSale,overallDiscount,couponDiscount,orders} = req.body;
        //console.log("qq",req.body)

        // craete excel workbook and worksheet
        const workBook =new ExcelJs.Workbook();
        const workSheet = workBook.addWorksheet("Sales Report");

        // create header row
        workSheet.addRow(["Date","Sub Total","Payment Method","Coupon Discount","Product Discount","Net total"]);

        // overall data report
        orders.forEach((order)=>{
            workSheet.addRow([
                order.date,
                order.subTotal,
                order.paymentMethod,
                order.couponDiscount,
                order.productDiscount,
                order.netTotal
            ])
        })

        // table datas
        workSheet.addRow([])
        workSheet.addRow(["Overal Sale Count",saleCount])
        workSheet.addRow(["Overall Order Amount",totalSale])
        workSheet.addRow(["Product Discount",overallDiscount])
        workSheet.addRow(["Coupon Discount",couponDiscount])

        // set a header response to trigger a file to download
        res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        res.setHeader("Content-Disposition","attachment; filename=Sales_Report.xlsx")

        //sent the work book to download
        await workBook.xlsx.write(res);
        res.end;
    } catch (error) {
        console.error("Error in Generating the Sale Report..",error);
        res.status(500).send("Failed to generate Report.")
    }
}

module.exports = {
    saleFilter,
    saleFilterByDate,
    downloadReport
}