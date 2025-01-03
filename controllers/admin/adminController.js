const User = require("../../models/userSchema");
const mongoose =require("mongoose");
const Order = require("../../models/orderSchema")
const bcrypt = require("bcrypt");


const pageerror = async(req,res)=>{
    res.render("admin-error")
}

const loadLogin = async(req,res)=>{
    if(req.session.admin){
        return res.redirect("/admin")
    }
    res.render("admin-login",{message:null})
}

const login = async(req,res)=>{
    try {
        const {email,password} = req.body;
        
        const admin =await User.findOne({email,isAdmin:true})
        //console.log("admin-",admin)
        if(admin){
             const passwordMatch = await bcrypt.compare(password, admin.password);
            // console.log("pass match-",passwordMatch);
             
             if(passwordMatch){
                req.session.admin = true;
                return res.redirect("/admin")
             }else{
                return res.redirect("/admin/login")
             }        
        }else{
            return res.redirect("/admin/login")
        }
    } catch (error) {
        console.log("Login error");
        return res.redirect("/pageerror"); 
    }
}

const loadDashboard = async(req,res)=>{
   try {
    const order = await Order.find().sort({createdAt:-1})

    const totalSale = order.reduce((sum,order) =>sum + order.total,0)
    const saleCount = await Order.countDocuments()
    const couponDiscount = order.reduce((sum,order) => sum+ order.couponDiscount ,0)
    const overallDiscount = order.reduce((sum,order) => sum + order.productOfferTotal,0)
    
    console.log("sale",totalSale,saleCount,couponDiscount,overallDiscount);
   
    res.render("dashboard",{order,totalSale,saleCount,couponDiscount,overallDiscount})
   } catch (error) {
    console.error("Error in loading dashboard",error);
    
   }
}

const logout = async(req,res)=>{
    try {
        req.session.destroy(err=>{
            if(err){
                console.log("Error destroying session");
                return res.redirect("/pageerror")
            }
            res.redirect("/admin/login")
        })
    } catch (error) {
        console.log("unexpected error during Admin logout",error);
        res.redirect("/pageerror")
    }
}




module.exports = {
    loadLogin,
    login,
    loadDashboard,
    pageerror,
    logout
}