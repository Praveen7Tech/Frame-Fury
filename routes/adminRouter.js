const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin/adminController");
const customerController = require("../controllers/admin/customerController");
const categoryController = require("../controllers/admin/categoryController");
const productController = require("../controllers/admin/productController")
const orderController = require("../controllers/admin/orderController")
const coupenController = require("../controllers/admin/coupenController")
const saleReportController = require("../controllers/admin/saleReportControllers")
const referralController = require("../controllers/admin/referralController")
const { adminAuth } = require("../middlewares/auth")
const multer = require("multer")
const storage = require("../helpers/multer")
const uploads = multer({ storage: storage })

router.get("/pageerror", adminController.pageerror)

//dashboard management
router.get("/", adminAuth, adminController.dashBoard)
router.get("/filterData", adminAuth, adminController.filterData)
router.get("/saleReport", adminAuth, adminController.loadDashboard)

//login management
router.get("/login", adminController.loadLogin)
router.post("/login", adminController.login)
router.get("/logout", adminController.logout)

//customer management
router.get("/users", adminAuth, customerController.customerInfo)
router.get("/blockCustomer", adminAuth, customerController.customerBlocked)
router.get("/unBlockCustomer", adminAuth, customerController.customerunBlocked)

//category management
router.get("/category", adminAuth, categoryController.categoryInfo)
router.post("/addCategory", adminAuth, categoryController.addCategory)
router.post("/addOffer", adminAuth, categoryController.addOffer)
router.put("/editOffer", adminAuth, categoryController.editOffer)
router.get("/removeOffer", adminAuth, categoryController.removeOffer)

// listing category
router.get("/listCategory", adminAuth, categoryController.listCategory)
router.get("/unlistCategory", adminAuth, categoryController.unlistCategory)
router.get("/editCategory", adminAuth, categoryController.editCategory)
router.post("/editCategory/:id", adminAuth, categoryController.updateCategory)

//product management
router.get("/addProducts", adminAuth, productController.productAddpage)
router.post("/addProducts", adminAuth, uploads.array("images", 4), productController.addProducts)
router.get("/products", adminAuth, productController.getAllProducts)
router.post("/addProOffer", adminAuth, productController.addOffer)
router.put("/editProOffer", adminAuth, productController.editOffer)
router.post("/removeOffer/:id", adminAuth, productController.removeOffer)

//block / unblock product
router.get("/blockProduct", adminAuth, productController.blockProduct)
router.get("/unblockProduct", adminAuth, productController.unblockProduct)

router.get("/editProduct", adminAuth, productController.editProduct)
router.post("/editProduct/:id", adminAuth, uploads.array("images", 4), productController.updateProduct)
router.post("/deleteImage", adminAuth, productController.deleteImage)

//order management
router.get("/orderList", adminAuth, orderController.orderList)
router.get("/orderView/:orderId", adminAuth, orderController.orderView)
router.get("/orderEdit/:orderId", adminAuth, orderController.EditStatusPage)
router.post("/orderEdit/:orderId", adminAuth, orderController.EditStatus)

//coupen management
router.get("/coupon", adminAuth, coupenController.CoupenPage)
router.post("/addCoupon", adminAuth, coupenController.addCopen)
router.get("/deleteCoupon", adminAuth, coupenController.deleteCoupon)
router.post("/editCoupon", adminAuth, coupenController.editCoupon)

// sale report Order Filtering
router.get("/filterOrder", adminAuth, saleReportController.saleFilter)
router.get("/filterbyDate", adminAuth, saleReportController.saleFilterByDate)
router.post("/downloadReport", adminAuth, saleReportController.downloadReport)
router.post("/saleReportDownloadPDF", adminAuth, saleReportController.downloadPdfFormat)

// refferal page
router.get("/Referals", adminAuth, referralController.ReferralPage)


module.exports = router
