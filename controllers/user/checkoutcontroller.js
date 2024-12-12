
const User = require("../../models/userSchema");
const Cart = require("../../models/cartSchema");
const Address = require("../../models/addressSchema");


const checkOutPage = async(req,res)=>{
    try {
        const userId = req.session.user;
        const cart = await Cart.findOne({userId}).populate("items.productId")
        const address = await Address.findOne({userId})

        console.log("cart-",cart);
        const shiipingCost = 0;
        const subTotal = cart.items.reduce((sum, item)=> sum + item.totalPrice * cart.items.length ,0);
        const total = subTotal + shiipingCost
        console.log("subTotal",subTotal);
        console.log("Total",total)

        res.render("checkout",{
            user:userId,
            cart:cart ? cart.items:[],
            address : address ? address:[],
            subTotal,
            total
        })
    } catch (error) {
        console.error("Error in showing checkout page",error);
        res.redirect("/pageNotFound")
    }
}



module.exports ={
    checkOutPage
}