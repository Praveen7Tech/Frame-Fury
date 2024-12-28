const Coupen = require("../../models/coupenSchema")

const CoupenPage = async(req,res)=>{
    try {
        const coupon = await Coupen.find();
       
        res.render("couponPage",{coupon})
    } catch (error) {
        console.error("Error in loading copen page",error);
    }
}


const addCopen = async(req,res)=>{
    try {
        const {code,offerPrice,minPurchase,expiry,status,UsageLimit} = req.body;
         
        const copon = new Coupen({
            name:code,
            offerPrice:offerPrice,
            minimumPrice: minPurchase || 0,
            expireOn:expiry,
            UsageLimit,
            isList:status ==="active"
        })
        await copon.save();
        res.redirect("/admin/coupon");
        console.log("copen created successfully");
    } catch (error) {
        console.error("Error in adding copon",error);
    }
}



const deleteCoupon = async(req,res)=>{
    try {
        const couponId = req.query.couponId;
        console.log("cop id",couponId);

        await Coupen.findByIdAndDelete(couponId);
        res.redirect("/admin/coupon")
        console.log("coupon deleted successfully");
        
    } catch (error) {
        console.error("Error in deleting coupon");
        res.status(500).send("An Error occured while deleting the coupon..")       
    }
}


const editCoupon = async(req,res)=>{
    try {
        const {couponId,amount,expiryDate,minPurchase} = req.body
        console.log(" cop body :",req.body);
        
        const coupon = await Coupen.findById(couponId)

        coupon.offerPrice = amount
        coupon.expireOn = expiryDate
        coupon.minimumPrice = minPurchase
        coupon.save()

        res.status(200).send("Coupon Updated Succesfully")
        console.log("Coupon Updated Successfully")
    } catch (error) {
        console.error("Error in Editing Coupon",error);
        res.status(500).send("An error occured in updating Coupon..!")
    }
}


module.exports ={
    CoupenPage,
    addCopen,
    deleteCoupon,
    editCoupon
}