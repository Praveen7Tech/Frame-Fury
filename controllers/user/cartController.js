const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Category = require("../../models/categorySchema");
const Wishlist = require("../../models/wishListSchema");
//const { cartCount } = require("../../middlewares/auth");


const cartPage = async (req, res) => {
    try {
      const userId = req.session.user;
  
      const cart = await Cart.findOne({ userId }).populate({
        path: "items.productId",
        populate: { path: "category", select: "name categoryOffer" },
      });
  
      const user = await User.findById(userId);
      const categories = await Category.find({ isListed: true });
  
      const listedCategory = categories.map(category => category._id.toString());
  
      const findProduct = cart.items.filter(item => {
        const product = item.productId;
        return (
          product.isBlocked === false &&
          listedCategory.includes(product.category._id.toString())
        );
      });


      res.render("cart", {user:userId, cart: findProduct});
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
  
      // Find the user's cart
      let cart = await Cart.findOne({ userId });
      if (!cart) {
        cart = new Cart({ userId, items: [] });
      }
  
      // Find the product by ID and populate its category to get the category offer
      const product = await Product.findById(productId).populate("category", "categoryOffer");
  
      console.log("product : ",product)
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
  
      console.log("pro qty :",product.quantity)
      if (product.quantity <= 0) {
        return res.status(400).json({ success: false, message: "Product is out of stock..!" });
      }
  
      // Get product and category offers
      const productOffer = product.offer || 0;
      const categoryOffer = product.category?.categoryOffer || 0;
  
      const bestOffer = Math.max(productOffer, categoryOffer);
  
      // Calculate the updated price based on the best offer
      const updatedPrice = bestOffer > 0 ? product.salePrice - (product.salePrice * bestOffer / 100) : product.salePrice;
  
      // Check if the product is already in the cart
      const productInCart = cart.items.find((item) => item.productId.toString() === productId);
  
      if (productInCart) {
        if (productInCart.quantity >= cartLimit) {
          return res.status(400).json({ success: false, message: "Maximum quantity for this product reached...!" });
        }
  
        // Update the quantity and total price
        productInCart.quantity += 1;
        productInCart.totalPrice = updatedPrice * productInCart.quantity;
        product.quantity -= 1; // Decrease the quantity from stock
      } else {
        // Add new product to the cart
        cart.items.push({
          productId,
          price: Math.floor(updatedPrice),
          totalPrice: Math.floor(updatedPrice),
          quantity: 1,
        });
  
        product.quantity -= 1; // Decrease the quantity from stock
      }
  
      // Save the updated product and cart
      await product.save();
      await cart.save();

      const cartCount = cart.items.length;
      req.session.cartCount = cartCount
      //console.log("suii",cartCount)
  
      console.log("Product added to cart successfully");
      return res.status(200).json({ success: true, message: "Product added to Cart Successfully.",cartCount:cartCount });
  
    } catch (error) {
      console.error("Error in add to cart", error);
      return res.status(500).json({ success: false, message: "Server Error!" });
    }
  };
  



// const removeProduct = async (req, res) => {
//     try {
//         const productId = req.query.productId;
//         const userId = req.session.user;

//         const cart = await Cart.findOne({ userId });

//         if (!cart) {
//             return res.redirect("/cart");
//         }

//         const findProduct = cart.items.find((item)=> item.productId.toString() === productId)
//         console.log("findProduct", findProduct);
        

//         const removeQty = findProduct.quantity;

//         cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
//         await cart.save();

//         await Product.findByIdAndUpdate(productId,{$inc:{quantity:removeQty}})    

//         return res.redirect("/cart");
//     } catch (error) {
//         console.error("Error in removing item from cart", error);
//         return res.status(500).json({ status: false, message: "Server Error!" });
//     }
// };

const removeProduct = async (req, res) => {
  try {
      const productId = req.query.productId;
      const userId = req.session.user;

      const cart = await Cart.findOne({ userId });

      if (!cart) {
          return res.redirect("/cart");
      }

      const findProduct = cart.items.find((item) => item.productId.toString() === productId);
      const removeQty = findProduct.quantity;

      cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
      await cart.save();

      await Product.findByIdAndUpdate(productId, { $inc: { quantity: removeQty } });

      // dynamically Update cart count
      const cartCount = cart.items.length;
      req.session.cartCount = cartCount;

      res.status(200).json({ success: true, cartCount: cartCount });

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
        console.log("zooo",findProduct.quantity);

        
        findProduct.totalPrice = findProduct.price * quantity

        await product.save();
        await cart.save();
        return res.status(200).json({status: true,quantity:findProduct.quantity,totalPrice:findProduct.price ,message:"Cart updated succesfuly."})
    } catch (error) {
        console.error("Error in updating quantity",error);
        return res.status(500).json({status: false, message:"Server Error...!"})
    }
}

const cartCount = async(req,res)=>{
  try {
      if (!req.session.user) {
          return res.json({ success: false, message: "User not logged in" });
      }

      const userId = req.session.user._id;
      const cart = await Cart.findOne({ userId });
      const cartCount = cart ? cart.items.length : 0;

      return res.json({ success: true, cartCount });
  } catch (error) {
      console.error("Error fetching wishlist count:", error);
      return res.json({ success: false, message: "Failed to fetch wishlist count" });
  }
}



module.exports = {
    cartPage,
    addToCart,
    removeProduct,
    updateCartQuantity,
    cartCount
}