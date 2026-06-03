const Coupen = require("../../models/coupenSchema")
const STATUS_CODE = require("../../constants/statuscode");
const MESSAGES = require("../../constants/messages");

const CoupenPage = async (req, res) => {
    try {
        const coupon = await Coupen.find();

        res.render("couponPage", { coupon })
    } catch (error) {
        console.error("Error in loading copen page", error);
    }
}


const addCopen = async (req, res) => {
    try {
        const { code, offerPrice, minPurchase, expiry, status, UsageLimit } = req.body;

        const copon = new Coupen({
            name: code,
            offerPrice: offerPrice,
            minimumPrice: minPurchase || 0,
            expireOn: expiry,
            UsageLimit,
            isList: status === "active"
        })
        await copon.save();
        res.redirect("/admin/coupon");
        console.log("copen created successfully");
    } catch (error) {
        console.error("Error in adding copon", error);
    }
}



const deleteCoupon = async (req, res) => {
    try {
        const couponId = req.query.couponId;
        console.log("cop id", couponId);

        await Coupen.findByIdAndDelete(couponId);
        res.redirect("/admin/coupon")
        console.log("coupon deleted successfully");

    } catch (error) {
        console.error("Error in deleting coupon");
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).send(MESSAGES.ERROR_DELETING_COUPON)
    }
}


const editCoupon = async (req, res) => {
    try {
        const { couponId, amount, expiryDate, minPurchase, UsageLimit } = req.body
        console.log(" cop body :", req.body);

        const coupon = await Coupen.findById(couponId)

        coupon.offerPrice = amount
        coupon.expireOn = expiryDate
        coupon.minimumPrice = minPurchase
        coupon.UsageLimit = UsageLimit
        coupon.save()

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