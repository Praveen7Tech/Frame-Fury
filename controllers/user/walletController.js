const Order= require("../../models/orderSchema")
const Wallet = require("../../models/walletSchema")
const {v4: uuidv4} = require("uuid")

const walletPage = async(req,res)=>{
    try {
        const user = req.session.user;
        const userId = req.session.user._id;
        
        const wallet = await Wallet.findOne({userId}).lean()

        if(wallet ){
            wallet.transactions.sort((a,b) =>new Date(b.date) - new Date(a.date))
            wallet.onlinePurchase.sort((a,b) => new Date(b.date) -new Date(a.date))
            wallet.refundHistory.sort((a,b) => new Date(b.date) - new Date(a.date))
        }

        res.render("wallet",{user,wallet})
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

        // console.log("bodyyy",req.body)
        // console.log("user-",userId);
        // console.log("uuid",transactionId)

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
                ],
                onlinePurchase:[],
                refundHistory:[]
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

        console.log("Amount added to wallet successfully");
        return res.status(200).json({message:"Amount Added To Wallet Successfully.",wallet})
        

    } catch (error) {
        console.error("Error in amount adding in wallet",error);
        res.status(500).json({messgae:"Internal Server Error.!"})
    }
}



module.exports ={
    walletPage,
    AddMoneyToWallet
}