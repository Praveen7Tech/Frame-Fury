const mongoose = require("mongoose");
const Product = require("./productSchema");

const {Schema} = mongoose;

const orderSchema = new Schema({
    
    orderId:{
        type:String,
        required:true
    },
    userId :{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    address: {
        addressType: {
            type: String, 
            required: true 
        },
        name: { 
            type: String, 
            required: true 
        },
        city: { 
            type: String, 
            required: true 
        },
        landMark: { 
            type: String, 
            required: true 
        },
        state: { 
            type: String, 
            required: true 
        },
        pincode: { 
            type: Number, 
            required: true 
        },
        phone: { 
            type: String, 
            required: true 
        },
        altPhone: { 
            type: String, 
            required: true 
        }
    },
    items:[{
        productId:{
            type:Schema.Types.ObjectId,
            ref:"Product",
            required:true
        },
        productName:{
            type:String,
            required:true
        },
        description:{
            type:String,
            required:true
        },
        productImage:{
            type:String,
            required:true
        },
        category:{
            type:String,
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
        price:{
            type:Number,
            required:true
        }
    }],
    productOfferTotal:{
        type:Number,
        default:0
    },
    paymentMethod:{
        type:String,
        enum:["COD","Online","wallet"]
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
        enum:["Pending","Confirmed","Shipped",'Deliverd',"Cancelled","Returned"],
        default:"Pending"
    },
    cancelReason:{
        type:String,
        default:null
    },
    deleiverdDate:{
        type:Date,
        default:null
    },
    couponDiscount:{
        type:Number,
        default:null,
    },
    couponCode:{
        type:String,
        default:null
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    paymentId:{
        type:String,
        required:false
    },
    paymentStatus:{
        type:String,
        enum:["Pending","Paid","Failed"],
        default:"Pending"
    }
})


const Order =mongoose.model("Order",orderSchema);

module.exports = Order