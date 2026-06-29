const Coupon = require("../../models/coupenSchema")
const STATUS_CODE = require("../../constants/statuscode");
const MESSAGES = require("../../constants/messages");

const verifyCoupon = async (req, res) => {
  try {
    const { couponCode, subTotal } = req.body;
    const userId = req.session.user?._id
    console.log("body : ", req.body);

    if (!userId) {
      return res.status(STATUS_CODE.UNAUTHORIZED).json({ success: false, message: MESSAGES.USER_NOT_LOGGED_IN })
    }

    const coupon = await Coupon.findOne({ name: couponCode, isList: true });
    if (!coupon) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: MESSAGES.COUPON_NOT_FOUND })
    }
    console.log("coupon -", coupon);

    if (new Date() > coupon.expireOn) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({ success: false, message: MESSAGES.COUPON_EXPIRED })
    }

    if (subTotal < coupon.minimumPrice) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({ success: false, message: MESSAGES.MINIMUM_PURCHASE_REQUIRED + coupon.minimumPrice })
    }
    console.log("min price:", coupon.minimumPrice);

    const usedUsers = Array.isArray(coupon.userId) ? coupon.userId : [];
    const alreadyUsedByUser = usedUsers.some((id) => id.toString() === userId.toString());
    console.log("User already userd -", alreadyUsedByUser, userId)

    if (coupon.UsageLimit <= 0 || alreadyUsedByUser) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({ success: false, message: MESSAGES.COUPON_LIMIT_REACHED })
    }

    return res.status(STATUS_CODE.OK).json({ success: true, discount: coupon.offerPrice })

  } catch (error) {
    console.error("Error in verifying coupon.", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.ERROR_VERIFYING_COUPON })
  }
}



module.exports = {
  verifyCoupon
}