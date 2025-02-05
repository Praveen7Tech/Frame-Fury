const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");
const Wishlist = require("../../models/wishListSchema");

const productDetails = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        const productId = req.query.id;


        // Fetch the product and ensure both product and category are not blocked
        const product = await Product.findOne({
            _id: productId,
            isBlocked: false,
        }).populate({
            path: 'category',
            match: { isListed: true }, // check the category is not blocked
            select: 'name categoryOffer',
        });

        console.log("product -", product);

        // If the product or its category is not found or is blocked, redirect to the home page
        if (!product || !product.category) {
            return res.redirect("/");
        }

        const findCategory = product.category;

        // Fetch related products based on the same category, excluding the current product and ensuring they are not blocked
        const relatedProducts = await Product.find({
            category: findCategory._id,
            _id: { $ne: productId }, // Exclude the current product
            isBlocked: false,        // Ensure related products are not blocked
        }).limit(4);

        // Dynamically check if the product is already in the wishlist
        let wishList = [];
        let userWishList = 0;
        if (userId) {
            userWishList = await Wishlist.findOne({ userId: userId }).populate("products");
            if (userWishList) {
                wishList = userWishList.products.map(item => item.productId._id.toString());
            }
        }

        // Render the product details page
        res.render("product-details", {
            user: userData,
            product: product,
            relatedProducts: relatedProducts, // Related products to the view
            quantity: product.quantity,
            category: findCategory,
            productId,
            wishList: wishList,
        });

    } catch (error) {
        console.error("Error fetching product details", error);
        res.redirect("/pageNotFound");
    }
};



module.exports = {
    productDetails
}
