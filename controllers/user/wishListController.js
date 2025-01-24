
const Product = require("../../models/productSchema");
const Wishlist = require("../../models/wishListSchema")


const wishListPage = async (req, res) => {
    try {
        const user = req.session.user;
        const userId = req.session.user._id;

        const wishlist = await Wishlist.findOne({ userId }).populate("products.productId");
        console.log("wish",wishlist)
        res.render("wishList", { user, wishlist });
    } catch (error) {
        console.error("Error in loading wishlist:", error);
        res.status(500).send("Internal Server Error");
    }
};


const addToWishList = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user._id;
        //console.log("Product ID:", productId);
        //console.log("User ID:", userId);

        const wishlist = await Wishlist.findOne({ userId });
        console.log("Wishlist:", wishlist);

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404) .json({ success: false, message: "Product not found." });
        }
        //console.log("Product:", product);

        if (wishlist) {
            const existProduct = wishlist.products.find(
                (item) => item.productId.toString() === productId
            );
            if (existProduct) {
                return res .status(400).json({ success: false, message: "Product is already in the wishlist!" });
            }

            // Add the product to the existing wishlist
            wishlist.products.push({
                productId,
                price: product.salePrice,
                stockStatus: product.status,
            });

            //dynamically showing wishlist count
            const wishListCount = wishlist.products.length;
            req.session.wishListCount = wishListCount;

            await wishlist.save();
            return res .status(200).json({ success: true,wishListCount, message: "Product added to the wishlist successfully.", wishListCount:wishListCount });
        }

        // Create a new wishlist if none exists
        const newWishlist = new Wishlist({
            userId,
            products: [
                {
                    productId,
                    price: product.salePrice,
                    stockStatus: product.status,
                },
            ],
        });

        //wishlist count dynamically
        const newwishListCount = newWishlist.products.length;
        req.session.wishListCount = newwishListCount

        await newWishlist.save();
        return res .status(200) .json({ success: true, message: "Product added to the wishlist successfully.",
            wishListCount:newwishListCount
         });
    } catch (error) {
        console.error("Error in adding product to wishlist:", error);
        return res
            .status(500)
            .json({ success: false, message: "Internal Server Error...!" });
    }
};


const removeFromWishList = async(req,res)=>{
    try {
        const productId = req.query.productId
        console.log("id-",productId);
        
        const userId = req.session.user._id;

        const wishList = await Wishlist.findOne({userId});
        console.log("wishlist -",wishList);

        wishList.products = wishList.products.filter((item)=> item.productId.toString() !== productId);
        await wishList.save();

        const wishListCount = wishList.products.length;
        req.session.wishListCount = wishListCount
        
        res.status(200).json({success:true,wishListCount:wishListCount})
        
    } catch (error) {
       console.error("Error in remove product from wishList",error);
       res.status(500).json({success:false,message:"Server Error..!"})
    }
}




module.exports = {
    wishListPage,
    addToWishList,
    removeFromWishList
}