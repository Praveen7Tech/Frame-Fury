const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");

const productDetails = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        const productId = req.query.id;

        // Fetch the current product and its category
        const product = await Product.findById(productId).populate('category');
        const findCategory = product.category;

      
        // Fetch related products based on the same category, excluding the current product
        const relatedProducts = await Product.find({
            category: findCategory._id,
            _id: { $ne: productId }, // Exclude the current product
        }).limit(4); 

        res.render("product-details", {
            user: userData,
            product: product,
            relatedProducts: relatedProducts, //  related products to the view
            quantity: product.quantity,
            category: findCategory,
            productId
        });
    } catch (error) {
        console.error("Error fetching product details", error);
        res.redirect("/pageNotFound");
    }
};



module.exports ={
    productDetails
}
