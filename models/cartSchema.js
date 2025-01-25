
const mongoose = require("mongoose")

const { Schema } = mongoose

const cartSchema = new Schema({

    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
        required: true
    },
    items: [{
        productId: {
            type: Schema.Types.ObjectId,
            require: true,
            ref: "Product",
        },
        quantity: {
            type: Number,
            require: true,
            default: 1,
        },
        price: {
            type: Number,
            require: true,

        },
        totalPrice: {
            type: Number,
            required: true
        },
    }]
})

const Cart = mongoose.model("Cart", cartSchema)

module.exports = Cart