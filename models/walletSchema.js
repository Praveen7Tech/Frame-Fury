const mongoose = require("mongoose");

const { Schema } = mongoose;

const walletSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  transactionType: {
    type: String,
    enum: ["credit", "debit", "refund"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  walletBalanceAfter: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Completed", "Failed", "Refunded"],
    default: "Pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  orderId: {
    type: String,
    default: null, 
  },

});



const Wallet = mongoose.model("Wallet", walletSchema);

module.exports = Wallet;
