const ExcelJs = require("exceljs")
const PDFdocucument = require("pdfkit")
const Order = require("../../models/orderSchema")

const saleFilter = async (req, res) => {
    try {
        const { filterType, page = 1, limit = 10 } = req.query; // Default to page 1, limit 10
        console.log("fill query -", filterType);

        const today = new Date();
        let dayStart, dayEnd;

        switch (filterType) {
            case "daily":
                dayStart = new Date(today.setHours(0, 0, 0, 0));
                dayEnd = new Date(today.setHours(23, 59, 59, 999));
                break;
            case "weekly":
                dayStart = new Date(today.setDate(today.getDate() - today.getDay()));
                dayEnd = new Date(dayStart);
                dayEnd.setDate(dayStart.getDate() + 6);
                break;
            case "monthly":
                dayStart = new Date(today.getFullYear(), today.getMonth(), 1);
                dayEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case "yearly":
                dayStart = new Date(today.getFullYear(), 0, 1);
                dayEnd = new Date(today.getFullYear(), 11, 31);
                break;
            default:
                dayStart = new Date(0);
                dayEnd = new Date();
                break;
        }

        // Fetch filtered orders with pagination
        const skip = (page - 1) * limit;
        
        const orders = await Order.find({ createdAt: { $gte: dayStart, $lte: dayEnd } })
            .populate("userId","name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalOrders = await Order.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } });
        const totalPages = Math.ceil(totalOrders / limit);

        const order = await Order.find({ createdAt: { $gte: dayStart, $lte: dayEnd } })
            .sort({ createdAt: -1 })
        const orderCount = order.length;
        const orderTotal = order.reduce((sum, order) => sum + order.total, 0);
        const overalDiscount = order.reduce((sum, order) => sum + order.productOfferTotal, 0);
        const couponDiscountTotal = order.reduce((sum, order) => sum + order.couponDiscount, 0);

        res.status(200).json({
            orders,
            orderCount,
            orderTotal,
            overalDiscount,
            couponDiscountTotal,
            currentPage: parseInt(page),
            totalPages,
        });
        //console.log("ord :",orders)
    } catch (error) {
        console.error("Error in Sale order filtering", error);
        res.status(500).json({ message: "Internal Server Error." });
    }
};



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

        // craete excel workbook and worksheet
        const workBook =new ExcelJs.Workbook();
        const workSheet = workBook.addWorksheet("Sales Report");

        // create header row
        workSheet.addRow(["Date","Name","Email","Address","Product Details","Payment Method","Coupon Discount","Product Discount","Sub Total","Net total"]);

        // overall data report
        orders.forEach((order)=>{
            workSheet.addRow([
                order.date,
                order.name,
                order.email,
                order.address,
                order.productDetails,
                order.paymentMethod,
                order.couponDiscount,
                order.productDiscount,
                order.subTotal,
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


const downloadPdfFormat = async(req,res)=>{
    try {
        const {saleCount,totalSale,productDiscount,couponDiscount,orders} = req.body
        console.log("body",req.body)
        const doc = new PDFdocucument();
        res.setHeader("Content-Type","application/json")
        res.setHeader("Content-Disposition","attachment; filenmae='Sales_Report.pdf'")

        // pipe the pdf to the response
        doc.pipe(res);

        //pdf Content
        doc.fontSize(18).text("Sale-Report",{align:"center"})
        doc.moveDown()
        doc.fontSize(12).text(`Total Sales Count : ${saleCount}`)
        doc.text(`Total Sale Amount : ${totalSale}`)
        doc.text(`Overal Product Discount : ${productDiscount}`)
        doc.text(`Overal Coupon Discount : ${couponDiscount}`)
        doc.moveDown()

        //table content
        doc.text("Orders",{underline:true})
        orders.forEach((order,index)=>{
            doc.moveDown()
            doc.text(`Order #${index +1}`)
            doc.text(`Date ${order.date}`)
            doc.text(`SubTotal ${order.subTotal}`)
            doc.text(`Payment Method ${order.paymentMethod}`)
            doc.text(`Coupon Discount ${order.couponDiscount}`)
            doc.text(`Product Discount ${order.productDiscount}`)
            doc.text(`Net Total ${order.netTotal}`)
            doc.moveDown()
        })
        doc.end()
    } catch (error) {
        console.error("Error in Creating PDF format sale report",error);
        res.status(500).json({error:"Internal Server error  "})
    }
}

module.exports = {
    saleFilter,
    saleFilterByDate,
    downloadReport,
    downloadPdfFormat
}