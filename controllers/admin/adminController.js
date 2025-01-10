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

const dashBoard = async(req,res)=>{
    try {

        // best selling product order
        const product = await Order.aggregate([
            {$unwind:"$items"},
            {$group:
                {_id:"$items.productId",
                    totalOrder:{"$sum":1}
                }
            },
            {
                $lookup:{
                    from:"products",
                    localField:"_id",
                    foreignField:"_id",
                    as:"productDetails"
                }
            },
            { $unwind:"$productDetails" },
            {
                $project:{
                    _id:1,
                    productName:"$productDetails.productName",
                    totalOrder:1,
                    productImage:{$arrayElemAt:["$productDetails.productImage",0]}
                }
            },
            {
                $sort:{totalOrder:-1}
            }
            
        ])

        // best selling category order
        const category = await Order.aggregate([
            {$unwind:"$items"},
            {
                $lookup:{
                    from:"products",
                    localField:"items.productId",
                    foreignField:"_id",
                    as:"productDetails"
                }
            },
            {
                $unwind:"$productDetails"
            },
            {
                $group:{
                    _id:"$productDetails.category",
                    totalOrder:{$sum:"$items.quantity"}
                }
            },
            {
                $lookup:{
                    from:"categories",
                    localField:"_id",
                    foreignField:"_id",
                    as:"categoryDetails"
                }
            },
            {
                $unwind:"$categoryDetails"
            },
            {
                $project:{
                    categoryName:"$categoryDetails.name",
                    totalOrder:1
                }
            },
            {$sort:{totalOrder:-1}}
        ])

        console.log("pr",product)

        res.render("adminDashboard",{product,category})
    } catch (error) {
        console.error("Error in Loading Admin Dashboard",error);
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
    logout,
    dashBoard
}