const mongoose = require("mongoose");
const Product = require("./productSchema");

const {Schema} = mongoose;

const orderSchema = new Schema({

    userId :{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    addressId:{
        type:Schema.Types.ObjectId,
        ref:"Address",
        required:true
    },
    items:[{
        productId:{
            type:Schema.Types.ObjectId,
            ref:"Product",
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
        price:{
            type:Number,
            required:true
        },

    }],
    categoryId:{
        type:Schema.Types.ObjectId,
        ref:"Category"
    },
    paymentMethod:{
        type:String,
        enum:["COD","Online"]
    },
    subTotal:{
        type:Number,
        required:true
    },
    total:{
        type:Number,
        required:true
    },
    deliveryCharge:{
        type:Number,
        required:true
    },
    deliveryMethod:{
        type:String,
        required:true
    },
    orderStatus:{
        type:String,
        enum:["Pending","Confirmed","Shipped",'Deliverd',"Cancelled"],
        default:"Pending"
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
})


const Order =mongoose.model("Order",orderSchema);

module.exports = Order