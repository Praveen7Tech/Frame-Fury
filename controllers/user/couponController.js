const Coupon = require("../../models/coupenSchema")

const  verifyCoupon = async(req,res)=>{
    try {
      const {couponCode, subTotal} = req.body;
      console.log("body : ",req.body);

      const coupon = await Coupon.findOne({name:couponCode});
      if(!coupon){
        return res.status(404).json({success:false,message:"Coupon is Not found"})
      }
      console.log("coupon -",coupon);
     
      if(new Date > coupon.expireOn){
        return res.status(400).json({success:false, message:"Coupon is Expired..!"})
      }

      if(subTotal < coupon.minimumPrice){
        return res.status(400).json({success:false,message:`Minimum Purchase Amount for this Coupon is ₹ : ${coupon.minimumPrice} `})
      }
      console.log("min price:",coupon.minimumPrice);

      if(coupon.UsageLimit <= 0){
        return res.status(400).json({success:false,message:"Coupon Limit is Reached..!"})
      }
      
      //coupon.UsageLimit -=1
      coupon.save()
      return res.status(200).json({success:true,discount:coupon.offerPrice})

    } catch (error) {
        console.error("Error in verifying coupon.",error);
        res.status(500).json({success:false,message:"Error occured while verifying coupon"})
    }
}



module.exports ={
    verifyCoupon
}