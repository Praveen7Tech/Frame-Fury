const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");
const Wishlist = require("../../models/wishListSchema");

const productDetails = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        const productId = req.query.id;
        const user= userId

        // Fetch the current product and its category
        const product = await Product.findById(productId).populate('category');
        const findCategory = product.category;

      
        // Fetch related products based on the same category, excluding the current product
        const relatedProducts = await Product.find({
            category: findCategory._id,
            _id: { $ne: productId }, // Exclude the current product
        }).limit(4); 

        // dynamically showing product is alraedy in wishlist
        let wishList=[];
        let userWishList =0;
        if(user){
            userWishList = await Wishlist.findOne({userId:user._id}).populate("products")
            if(userWishList){
                wishList = userWishList.products.map(item => item.productId._id.toString())
            }
        }

        res.render("product-details", {
            user: userData,
            product: product,
            relatedProducts: relatedProducts, //  related products to the view
            quantity: product.quantity,
            category: findCategory,
            productId,
            wishList:wishList
        });

        
    } catch (error) {
        console.error("Error fetching product details", error);
        res.redirect("/pageNotFound");
    }
};



module.exports ={
    productDetails
}
