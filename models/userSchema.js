const mongoose = require("mongoose")

const { Schema } = mongoose

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: false,
        unique: false,
        sparse: true,
        default: null
    },
    googleId: {
        type: String,
        unique: true
    },
    password: {
        type: String,
        required: false // for single signup not using password
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    referralCode: {
        type: String,
        default: null
    },
    refferedCode: {
        type: String,
        default: null
    },
    referralPoint: {
        type: Number,
        default: 0
    },
    cart: [{
        type: Schema.Types.ObjectId,
        ref: "Cart"
    }],
    wallet: {
        type: Schema.Types.ObjectId
    },
    whishlist: [{
        type: Schema.Types.ObjectId,
        ref: "Whishlist"
    }],
    orderHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Order"
    }],
    createdon: {
        type: Date,
        default: Date.now
    },
    searchHistory: [{
        category: {
            type: Schema.Types.ObjectId,
            ref: "category"
        },
        searchOn: {
            type: Date,
            default: Date.now
        }
    }]
})

const User = mongoose.model("User", userSchema, "users")

module.exports = User