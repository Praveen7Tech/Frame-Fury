const Order= require("../../models/orderSchema")
const Wallet = require("../../models/walletSchema")
const {v4: uuidv4} = require("uuid")

const walletPage = async(req,res)=>{
    try {
        const user = req.session.user;
        const userId = req.session.user._id;
        const order = await Order.find({userId,paymentMethod:"Online"}).sort({createdAt:-1}).lean()
        const refundOrder = await Order.find({userId,orderStatus:"Cancelled"}).sort({createdAt:-1}).lean()

        // console.log("userid",order);
        // console.log("refund",refundOrder);
        
        const wallet = await Wallet.findOne({userId}).lean()

        if(wallet && wallet.transactions){
            wallet.transactions.sort((a,b) =>new Date(b.date) - new Date(a.date))
        }

        //console.log("wallet ",wallet)

        res.render("wallet",{user,order,refundOrder,wallet})
    } catch (error) {
        console.error("Error in loading wallet",error);
        res.redirect("/pageNotFound")
    }
}


const AddMoneyToWallet = async(req,res)=>{
    try {
        const {amount,paymentMethod,additionalDetail} =req.body;
        const amountNumber = Number(amount)
        const userId = req.session.user;
        let wallet = await Wallet.findOne({userId})
        const transactionId =uuidv4();

        console.log("bodyyy",req.body)
        console.log("user-",userId);
        console.log("uuid",transactionId)

        if(!wallet){
            wallet = new Wallet({
                userId,
                balance:amountNumber,
                transactions:[
                    {
                        transactionId,
                        transactionType:paymentMethod,
                        amount:amountNumber,
                        additionalDetails:additionalDetail,
                        date:new Date()
                    }
                ]
            })

            await wallet.save()
        }
        else{
            wallet.balance +=amountNumber,
            wallet.transactions.push({
                transactionId,
                transactionType:paymentMethod,
                amount:amountNumber,
                additionalDetails:additionalDetail,
                date:new Date()
            })

            await wallet.save()
        }

        return res.status(200).json({message:"Amount Added To Wallet Successfully.",wallet})
        console.log("Amount added to wallet successfully");

    } catch (error) {
        console.error("Error in amount adding in wallet",error);
        res.status(500).json({messgae:"Internal Server Error.!"})
    }
}



module.exports ={
    walletPage,
    AddMoneyToWallet
}