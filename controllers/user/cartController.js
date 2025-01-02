const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Category = require("../../models/categorySchema");


const cartPage = async (req, res) => {
    try {
        const userId = req.session.user;

        const cart = await Cart.findOne({ userId }).populate("items.productId");
        const user = await User.findById(userId);
        const categories = await Category.find({ isListed: true });
        
        
        const listedCategory = categories.map(category => category._id.toString());

        const findProduct = cart.items.filter(item => {
            const product = item.productId;
            return (
                product.isBlocked === false && 
                listedCategory.includes(product.category.toString())
            );
        });

        res.render("cart", {
            user,
            cart: findProduct, 
        });
    } catch (error) {
        console.error("Error in showing cart page", error);
        res.redirect("/pageNotFound");
    }
};


const addToCart = async (req, res) => {
    try {
        const productId = req.body.productId;
        const userId = req.session.user;
        const cartLimit = 5;

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        const productInCart = cart.items.find((item) => item.productId.toString() === productId);

        const product = await Product.findById(productId)
        if(!product){
            return res.status(404).json({status:false, message:"product not found"})
        }

        if(product.quantity <= 0){
            return res.status(400).json({status:false, message:"Product is out of stock..!"})
        }

        const updatedPrice = product.salePrice - (product.salePrice * product.offer / 100)
        //console.log("updated price-",updatedPrice)

        if (productInCart) {
           if(productInCart.quantity >= cartLimit){
            return res.status(200).json({status:false, message:"Maximum quantity add this product to cart is reached...!"})
           }

           productInCart.quantity +=1;
           productInCart.totalPrice = productInCart.price * productInCart.quantity;
           product.quantity -= 1; // decrasing the quantity from the stock
        }else{
           
            cart.items.push({
                productId,
                price:product.salePrice,
                totalPrice:updatedPrice,
                quantity:1
            })

            product.quantity -=1;
        }

        await product.save();
        await cart.save();
        console.log("Product added to cart successfully");
        return res.status(200).json({ status: true, message: "Product added to Cart Successfully." });
    } catch (error) {
        console.error("Error in add to cart", error);
        return res.status(500).json({ status: false, message: "Server Error!" });
    }
};



const removeProduct = async (req, res) => {
    try {
        const productId = req.query.productId;
        const userId = req.session.user;

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.redirect("/cart");
        }

        const findProduct = cart.items.find((item)=> item.productId.toString() === productId)
        console.log("findProduct", findProduct);
        

        const removeQty = findProduct.quantity;

        cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
        await cart.save();

        await Product.findByIdAndUpdate(productId,{$inc:{quantity:removeQty}})    

        return res.redirect("/cart");
    } catch (error) {
        console.error("Error in removing item from cart", error);
        return res.status(500).json({ status: false, message: "Server Error!" });
    }
};



const updateCartQuantity = async(req,res)=>{
    try {
        const {productId, quantity} = req.body;
        console.log("quantity-",quantity);
        
        const userId = req.session.user;
        const limit = 5;

        const cart = await Cart.findOne({userId});
        if(!cart){
            return res.status(404).json({status:false, message:"Cart not found..!"})
        }

        const product = await Product.findById(productId); // Find the product in the database
        if (!product) {
            return res.status(404).json({ status: false, message: "Product not found!" });
        }

        console.log("product--",product)

        const findProduct = cart.items.find((item)=> item.productId.toString() === productId);
        if(!findProduct){
            return res.status(404).json({status:false, message:"Product not found in the cart..!"})
        }


        console.log("find item:",findProduct)

        if(quantity > limit){
            return res.status(400).json({status:false, message:"Quantity not exceed 5."})
        }

        const qtyDefference = quantity - findProduct.quantity;

        if(qtyDefference > 0 && product.quantity < qtyDefference){
            return res.status(400).json({status:false, message:"Product out of stock..!"})
        }

        product.quantity -= qtyDefference;
        if(product.quantity <= 0){
            return res.status(400).json({statusbar:false, message:"Insufficient stock..."})
        }
       
        findProduct.quantity = quantity;
        findProduct.totalPrice = (findProduct.price - (findProduct.price * product.offer / 100)) * findProduct.quantity;

        await product.save();
        await cart.save();
        return res.status(200).json({status: true, message:"Cart updated succesfuly."})
    } catch (error) {
        console.error("Error in updating quantity",error);
        return res.status(500).json({status: false, message:"Server Error...!"})
    }
}





module.exports = {
    cartPage,
    addToCart,
    removeProduct,
    updateCartQuantity
}