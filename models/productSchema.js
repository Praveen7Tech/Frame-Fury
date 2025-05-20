
const mongoose = require("mongoose")

const { Schema } = mongoose

const productSchema = new Schema({
    productName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: String
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    regularPrice: {
        type: Number,
        required: true
    },
    salePrice: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        default: true
    },

    productImage: {
        type: [String],
        required: true
    },
    offer: {
        type: Number,
        default: 0
    },
    offerAmount: {
        type: Number,
        default: 0
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["Available", "Out of Stock", "Discountinued"],
        required: true,
        default: "Available"
    },
    createdOn: {
        type: Date,
        default: Date.now
    }
}, { Timestamp: true })


const Product = mongoose.model("Product", productSchema)

module.exports = Product