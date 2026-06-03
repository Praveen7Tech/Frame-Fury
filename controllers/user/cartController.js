const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Category = require("../../models/categorySchema");
const Wishlist = require("../../models/wishListSchema");
const STATUS_CODE = require("../../constants/statuscode");
const MESSAGES = require("../../constants/messages");
//const { default: items } = require("razorpay/dist/types/items");
//const { cartCount } = require("../../middlewares/auth");


const cartPage = async (req, res) => {
  try {
    const userId = req.session.user;

    let cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      populate: { path: "category", select: "name categoryOffer" },
    });

    const user = await User.findById(userId);
    const categories = await Category.find({ isListed: true });

    const listedCategory = categories.map((category) => category._id.toString());
    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
      });
    }

    console.log("cartu", cart);
    const findProduct = cart.items.filter((item) => {
      const product = item.productId;
      // Check if product exists before accessing its properties
      if (product && product.category) {
        console.log("item", product);
        return (
          product.isBlocked === false &&
          listedCategory.includes(product.category._id.toString())
        );
      }
      return false; // Exclude items with null or invalid products
    });
    console.log("find product:", findProduct);

    const total = findProduct.reduce((sum, items) => sum + items.totalPrice, 0);
    console.log("tot", total);

    res.render("cart", { user: userId, cart: findProduct, total });
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

    console.log("product : ", product)
    if (!product) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: MESSAGES.PRODUCT_NOT_FOUND });
    }

    console.log("pro qty :", product.quantity)
    if (product.quantity <= 0) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({ success: false, message: MESSAGES.PRODUCT_OUT_OF_STOCK });
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
        return res.status(STATUS_CODE.BAD_REQUEST).json({ success: false, message: MESSAGES.MAX_QUANTITY_REACHED });
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
    return res.status(STATUS_CODE.OK).json({ success: true, message: MESSAGES.PRODUCT_ADDED_TO_CART, cartCount: cartCount });

  } catch (error) {
    console.error("Error in add to cart", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SERVER_ERROR });
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

    const findProduct = cart.items.find((item) => item.productId.toString() === productId);
    const removeQty = findProduct.quantity;

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
    await cart.save();

    await Product.findByIdAndUpdate(productId, { $inc: { quantity: removeQty } });

    // dynamically Update cart count
    const cartCount = cart.items.length;
    req.session.cartCount = cartCount;

    res.status(STATUS_CODE.OK).json({ success: true, cartCount: cartCount });

  } catch (error) {
    console.error("Error in removing item from cart", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ status: false, message: MESSAGES.SERVER_ERROR });
  }
};


const updateCartQuantity = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    console.log("quantity-", quantity);

    const userId = req.session.user;
    const limit = 5;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ status: false, message: MESSAGES.CART_NOT_FOUND })
    }

    const product = await Product.findById(productId); // Find the product in the database
    if (!product) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ status: false, message: MESSAGES.PRODUCT_NOT_FOUND });
    }

    console.log("product--", product)

    const findProduct = cart.items.find((item) => item.productId.toString() === productId);
    if (!findProduct) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ status: false, message: MESSAGES.PRODUCT_NOT_IN_CART })
    }


    console.log("find item:", findProduct)

    if (quantity > limit) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({ status: false, message: MESSAGES.QUANTITY_LIMIT_EXCEEDED })
    }

    const qtyDefference = quantity - findProduct.quantity;

    if (qtyDefference > 0 && product.quantity < qtyDefference) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({ status: false, message: MESSAGES.PRODUCT_OUT_OF_STOCK })
    }

    product.quantity -= qtyDefference;
    if (product.quantity <= 0) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({ statusbar: false, message: MESSAGES.INSUFFICIENT_STOCK })
    }

    findProduct.quantity = quantity;
    console.log("zooo", findProduct.quantity);


    findProduct.totalPrice = findProduct.price * quantity

    await product.save();
    await cart.save();
    return res.status(STATUS_CODE.OK).json({ status: true, quantity: findProduct.quantity, totalPrice: findProduct.price, message: MESSAGES.CART_UPDATED })
  } catch (error) {
    console.error("Error in updating quantity", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ status: false, message: MESSAGES.SERVER_ERROR_ALT })
  }
}

const cartCount = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.json({ success: false, message: MESSAGES.USER_NOT_LOGGED_IN });
    }

    const userId = req.session.user._id;
    const cart = await Cart.findOne({ userId });
    const cartCount = cart ? cart.items.length : 0;

    return res.json({ success: true, cartCount });
  } catch (error) {
    console.error("Error fetching wishlist count:", error);
    return res.json({ success: false, message: MESSAGES.ERROR_FETCHING_WISHLIST });
  }
}



module.exports = {
  cartPage,
  addToCart,
  removeProduct,
  updateCartQuantity,
  cartCount
}