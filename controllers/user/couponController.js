const Coupon = require("../../models/coupenSchema")
const STATUS_CODE = require("../../constants/statuscode");
const MESSAGES = require("../../constants/messages");

const verifyCoupon = async (req, res) => {
  try {
    const { couponCode, subTotal } = req.body;
    console.log("body : ", req.body);

    const coupon = await Coupon.findOne({ name: couponCode });
    if (!coupon) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: MESSAGES.COUPON_NOT_FOUND })
    }
    console.log("coupon -", coupon);

    if (new Date > coupon.expireOn) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({ success: false, message: MESSAGES.COUPON_EXPIRED })
    }

    if (subTotal < coupon.minimumPrice) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({ success: false, message: MESSAGES.MINIMUM_PURCHASE_REQUIRED + coupon.minimumPrice })
    }
    console.log("min price:", coupon.minimumPrice);

    if (coupon.UsageLimit <= 0) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({ success: false, message: MESSAGES.COUPON_LIMIT_REACHED })
    }

    //coupon.UsageLimit -=1
    coupon.save()
    return res.status(STATUS_CODE.OK).json({ success: true, discount: coupon.offerPrice })

  } catch (error) {
    console.error("Error in verifying coupon.", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.ERROR_VERIFYING_COUPON })
  }
}



module.exports = {
  verifyCoupon
}