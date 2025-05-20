
const Product = require("../../models/productSchema");
const Wishlist = require("../../models/wishListSchema");
const Category = require("../../models/categorySchema")


const wishListPage = async (req, res) => {
    try {
      const user = req.session.user;
      const userId = req.session.user._id;
  
      const wishlist = await Wishlist.findOne({ userId }).populate("products.productId");

      const categories = await Category.find({ isListed: true });
      const listedCategory = categories.map((category) => category._id.toString());
  
      if (!wishlist) {
        return res.render("wishList", { user, wishlist: [] });
      }
  
      // Filter and map products with stock status
      const filteredProducts = await Promise.all(
        wishlist.products.map(async (item) => {
          const product = item.productId;
  
          // Check if the product exists, is not blocked, and belongs to a listed category
          if (
            product &&
            product.isBlocked === false &&
            listedCategory.includes(product.category._id.toString())
          ) {
            // Dynamically calculate stock status
            const stockStatus = product.quantity === 0 ? "Out of Stock" : "Available";
  
            return {
              ...item._doc, // Spread original item properties
              productId: {
                ...product._doc, // Spread product details
              },
              stockStatus, // Add the stock status
            };
          }
          return null; // Exclude products that don't match the criteria
        })
      );
  
      // Filter out any null entries
      const updatedWishlist = filteredProducts.filter((item) => item !== null);
  
      res.render("wishList", { user, wishlist: { products: updatedWishlist } });
    } catch (error) {
      console.error("Error in loading wishlist:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  
  
//   const wishListPage = async (req, res) => {
//     try {
//       const user = req.session.user;
//       const userId = req.session.user._id;
  
//       const wishlist = await Wishlist.findOne({ userId }).populate("products.productId");
//       const categories = await Category.find({ isListed: true });

//       const listedCategory = categories.map((category) => category._id.toString());
       
//       if (!wishlist) {
//         return res.render("wishList", { user, wishlist: [] });
//       }
  
//       // Filter out blocked products and category
//       const filteredProducts = wishlist.products.filter((item) => {
//         const product = item.productId;
//         return product && product.isBlocked === false && listedCategory.includes(product.category._id.toString())
//       });
  
//       // Update the wishlist object to reflect only non-blocked products
//       wishlist.products = filteredProducts;
//       console.log("wish-",wishlist);
      
  
//       res.render("wishList", { user, wishlist });
//     } catch (error) {
//       console.error("Error in loading wishlist:", error);
//       res.status(500).send("Internal Server Error");
//     }
//   };


const addToWishList = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user._id;
        //console.log("Product ID:", productId);
        //console.log("User ID:", userId);

        const wishlist = await Wishlist.findOne({ userId });
        console.log("Wishlist:", wishlist);

        const product = await Product.findById(productId).populate("category", "categoryOffer")
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }
        console.log("sale prod",product)
        const productOffer = product.offer || 0;
        const categoryOffer = product.category.categoryOffer || 0;
        const bestOffer = Math.max(productOffer,categoryOffer)
        const price = product.salePrice

        console.log("debug",productOffer,categoryOffer,bestOffer,price)

        const offerPrice = bestOffer > 0 ? Math.floor(price -(price * bestOffer / 100)) : price
        console.log("Product:", product);

        if (wishlist) {
            const existProduct = wishlist.products.find(
                (item) => item.productId.toString() === productId
            );
            if (existProduct) {
                return res.status(400).json({ success: false, message: "Product is already in the wishlist!" });
            }

            // Add the product to the existing wishlist
            wishlist.products.push({
                productId,
                price: offerPrice,
                stockCount:product.quantity,
                stockStatus: product.status,
            });

            //dynamically showing wishlist count
            const wishListCount = wishlist.products.length;
            req.session.wishListCount = wishListCount;

            await wishlist.save();
            return res.status(200).json({ success: true, wishListCount, message: "Product added to the wishlist successfully.", wishListCount: wishListCount });
        }

        // Create a new wishlist if none exists
        const newWishlist = new Wishlist({
            userId,
            products: [
                {
                    productId,
                    price: offerPrice,
                    stockStatus: product.status,
                    stockCount:product.quantity
                },
            ],
        });

        //wishlist count dynamically
        const newwishListCount = newWishlist.products.length;
        req.session.wishListCount = newwishListCount

        await newWishlist.save();
        return res.status(200).json({
            success: true, message: "Product added to the wishlist successfully.",
            wishListCount: newwishListCount
        });
    } catch (error) {
        console.error("Error in adding product to wishlist:", error);
        return res
            .status(500)
            .json({ success: false, message: "Internal Server Error...!" });
    }
};


const removeFromWishList = async (req, res) => {
    try {
        const productId = req.query.productId
        console.log("id-", productId);

        const userId = req.session.user._id;

        const wishList = await Wishlist.findOne({ userId });
        console.log("wishlist -", wishList);

        wishList.products = wishList.products.filter((item) => item.productId.toString() !== productId);
        await wishList.save();

        const wishListCount = wishList.products.length;
        req.session.wishListCount = wishListCount

        res.status(200).json({ success: true, wishListCount: wishListCount })

    } catch (error) {
        console.error("Error in remove product from wishList", error);
        res.status(500).json({ success: false, message: "Server Error..!" })
    }
}




module.exports = {
    wishListPage,
    addToWishList,
    removeFromWishList
}