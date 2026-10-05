const Coupen = require("../../models/coupenSchema")
const STATUS_CODE = require("../../constants/statuscode");
const MESSAGES = require("../../constants/messages");

const CoupenPage = async (req, res) => {
    try {
        const limit = 5;
        const requestedPage = Number.parseInt(req.query.page, 10);
        const couponCount = await Coupen.countDocuments();
        const totalPages = Math.max(1, Math.ceil(couponCount / limit));
        const currentPage = Number.isInteger(requestedPage) && requestedPage > 0
            ? Math.min(requestedPage, totalPages)
            : 1;
        const coupon = await Coupen.find()
            .sort({ createon: -1 })
            .skip((currentPage - 1) * limit)
            .limit(limit);

        res.render("couponPage", { coupon, currentPage, totalPages })
    } catch (error) {
        console.error("Error in loading coupon page", error);
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).send(MESSAGES.SERVER_ERROR);
    }
}


const addCopen = async (req, res) => {
    try {
        const { code, offerPrice, minPurchase, expiry, status, UsageLimit } = req.body;
        const couponCode = (code || "").trim();
        const discountAmount = Number(offerPrice);
        const minimumPurchase = Number(minPurchase);
        const usageLimit = Number(UsageLimit);

        if (!couponCode || couponCode.length < 4) {
            return res.status(400).send("Coupon code must be at least 4 characters long");
        }

        if (!Number.isFinite(minimumPurchase) || minimumPurchase <= 0) {
            return res.status(400).send("Minimum Purchase Amount must be greater than 0");
        }

        if (!Number.isFinite(discountAmount) || discountAmount <= 0 || discountAmount >= minimumPurchase) {
            return res.status(400).send("Discount amount must be greater than 0 and less than the minimum purchase amount");
        }

        if (!Number.isFinite(usageLimit) || usageLimit <= 0 || usageLimit > 5) {
            return res.status(400).send("Usage limit must be between 1 and 5");
        }

        if (!expiry) {
            return res.status(400).send("Please select an expiry date");
        }

        const selectedDate = new Date(expiry);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            return res.status(400).send("The expiry date must be today or later");
        }

        const existingCoupon = await Coupen.findOne({ name: { $regex: `^${couponCode}$`, $options: "i" } });
        if (existingCoupon) {
            return res.status(400).send("Coupon code already exists");
        }

        const copon = new Coupen({
            name: couponCode,
            offerPrice: discountAmount,
            minimumPrice: minimumPurchase,
            expireOn: expiry,
            UsageLimit: usageLimit,
            isList: status === "active"
        })
        await copon.save();
        res.redirect("/admin/coupon");
        console.log("copen created successfully");
    } catch (error) {
        console.error("Error in adding copon", error);
        res.status(500).send("Error adding coupon");
    }
}



const deleteCoupon = async (req, res) => {
    try {
        const deletedCoupon = await Coupen.findByIdAndDelete(req.params.couponId);
        if (!deletedCoupon) {
            return res.status(STATUS_CODE.NOT_FOUND).send("Coupon not found");
        }
        res.sendStatus(STATUS_CODE.OK);
    } catch (error) {
        console.error("Error in deleting coupon", error);
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).send(MESSAGES.ERROR_DELETING_COUPON)
    }
}


const editCoupon = async (req, res) => {
    try {
        const { amount, expiryDate, minPurchase, UsageLimit } = req.body;

        if (!expiryDate) {
            return res.status(400).send("Please select an expiry date");
        }

        const selectedDate = new Date(expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            return res.status(400).send("The expiry date must be today or later");
        }

        const coupon = await Coupen.findById(req.params.couponId);
        if (!coupon) {
            return res.status(STATUS_CODE.NOT_FOUND).send("Coupon not found");
        }

        coupon.offerPrice = amount
        coupon.expireOn = expiryDate
        coupon.minimumPrice = minPurchase
        coupon.UsageLimit = UsageLimit
        await coupon.save()

        res.status(STATUS_CODE.OK).send(MESSAGES.COUPON_UPDATED_SUCCESS)
        console.log("Coupon Updated Successfully")
    } catch (error) {
        console.error("Error in Editing Coupon", error);
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).send(MESSAGES.ERROR_UPDATING_COUPON)
    }
}


module.exports = {
    CoupenPage,
    addCopen,
    deleteCoupon,
    editCoupon
}