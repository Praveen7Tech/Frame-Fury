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


const downloadPdfFormat = async (req, res) => {
    try {
        const { saleCount, totalSale, productDiscount, couponDiscount, orders } = req.body;

        const doc = new PDFdocucument({ size: 'A4', layout: 'landscape', margin: 50 }); // Portrait layout for better readability

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename='Sales_Report.pdf'");

        doc.pipe(res);

        // Title and Summary
        doc.fontSize(18).text("Sales Report", { align: "center" }).moveDown();
        doc.fontSize(12)
            .text(`Total Sales Count : ${saleCount}`)
            .text(`Total Sale Amount : ${totalSale}`)
            .text(`Overall Product Discount : ${productDiscount}`)
            .text(`Overall Coupon Discount : ${couponDiscount}`)
            .moveDown();

        // Table Header Styling
        doc.fontSize(14).text("Order Summary", { underline: true, align: "left" }).moveDown();
        const tableTop = doc.y;
        const tableLeft = 50;
        const cellPadding = 5;
        const columnWidths = [20, 70, 60, 100, 120, 160, 50, 35, 35, 45, 45];
        const cellHeight = 25;

        // Render Table Headers
        const headers = [
            "No", "Date", "Name", "Email", "Address",
            "Product Details", "Payment Method", "Coupon",
            "Discount", "Subtotal", "Net Total"
        ];
        headers.forEach((header, index) => {
            doc.rect(
                tableLeft + columnWidths.slice(0, index).reduce((a, b) => a + b, 0),
                tableTop,
                columnWidths[index],
                cellHeight
            )
                .fillAndStroke("#f3f3f3", "#000")
                .fontSize(10)
                .fillColor("#000")
                .text(header, tableLeft + columnWidths.slice(0, index).reduce((a, b) => a + b, 0) + cellPadding, tableTop + cellPadding, {
                    width: columnWidths[index] - cellPadding * 2,
                    align: "center"
                });
        });

        // Table Rows
        let yPosition = tableTop + cellHeight;
        orders.forEach((order, index) => {
            const productDetails = order.items
                .map(item => `Product: ${item.productName}, Qty: ${item.quantity}, Price: ${item.price}`)
                .join("\n");

            const row = [
                index + 1,
                order.date,
                order.userName,
                order.userEmail,
                `${order.addressType}, ${order.city}, ${order.state}, ${order.pincode}`,
                productDetails,
                order.paymentMethod,
                order.couponDiscount,
                order.productDiscount,
                order.subTotal,
                order.netTotal
            ];

            row.forEach((cell, cellIndex) => {
                const cellHeightAdjusted = Math.max(
                    cellHeight,
                    doc.heightOfString(cell, { width: columnWidths[cellIndex] - cellPadding * 2 })
                );

                doc.rect(
                    tableLeft + columnWidths.slice(0, cellIndex).reduce((a, b) => a + b, 0),
                    yPosition,
                    columnWidths[cellIndex],
                    cellHeightAdjusted
                )
                    .stroke()
                    .fontSize(9)
                    .fillColor("#000")
                    .text(cell, tableLeft + columnWidths.slice(0, cellIndex).reduce((a, b) => a + b, 0) + cellPadding, yPosition + cellPadding, {
                        width: columnWidths[cellIndex] - cellPadding * 2,
                        align: cellIndex === 4 ? "left" : "center" // Align Address to left for better readability
                    });
            });

            yPosition += Math.max(cellHeight, doc.heightOfString(productDetails, { width: columnWidths[5] - cellPadding * 2 }) + cellPadding * 2);

            // Check if page break is needed
            if (yPosition + cellHeight > doc.page.height - 50) {
                doc.addPage();
                yPosition = 50; // Reset for new page
            }
        });

        doc.end();
    } catch (error) {
        console.error("Error in Creating PDF format sale report", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


module.exports = {
    saleFilter,
    saleFilterByDate,
    downloadReport,
    downloadPdfFormat
}