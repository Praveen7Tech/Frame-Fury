const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const Wishlist = require("../../models/wishListSchema");
const Wallet = require("../../models/walletSchema");
const Cart = require("../../models/cartSchema")
const dotenv = require("dotenv")
dotenv.config();
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const { search } = require("../../routes/userRouter");

const pageNotFound = async (req, res) => {
    try {
        res.render("page-404");
    } catch (error) {
        res.redirect("/pageNotFound", error);
    }
}

const loadHomepage = async (req, res) => {
    try {
      const user = req.session.user;
      const categories = await Category.find({ isListed: true });
  
      const productData = await Product.find({
        isBlocked: false,
        category: { $in: categories.map(category => category._id) },
      })
        .populate("category", "name categoryOffer") // Populate category offer
        .sort({ createdOn: -1 });
  

        // dynamically showing product is alraedy in wishlist
        let wishList=[];
        let userWishList =0;
        if(user){
            userWishList = await Wishlist.findOne({userId:user._id}).populate("products")
            if(userWishList){
                wishList = userWishList.products.map(item => item.productId._id.toString())
            }
        }
        //console.log("user111",user)
        

      res.render("home", { user, products: productData, category: categories, wishList:wishList});
    } catch (error) {
      console.error("Home page not found", error);
      res.status(500).send("Server error");
    }
  };
  


const loadSignup = async (req, res) => {
    try {
        return res.render("signup")
    } catch (error) {
        console.log("Home page not found", error);
        res.status(500).send("Server Error.");
    }
}

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        })

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "verify your account",
            text: `Your OTP is : ${otp}`,
            html: `<b> Your OTP : ${otp} </b>`
        })
        return info.accepted.length > 0
    } catch (error) {
        console.error("Error Sending Email");
        return false
    }
}

const signup = async (req, res) => {
    try {
        const { name, phone, email, password, cPassword, referalCode} = req.body;
        console.log("bd",req.body)

        if (password !== cPassword) {
            return res.render("signup", { message: "Password do not match" })
        }

        const findUser = await User.findOne({ email });
        if (findUser) {
            return res.render("signup", { message: "User with this email is already exist" })
        }

        const otp = generateOtp();

        const emailSend = await sendVerificationEmail(email, otp);
        if (!emailSend) {
            return res.json("email error")
        }

        if(referalCode){
            const existReferral = await User.findOne({referralCode:referalCode})
            console.log("refff",existReferral)
            if(!existReferral){
                return res.render("signup",{message:"Invalid Referral code...!"})
            }
            req.session.referalCode = referalCode ? referalCode : null
            
        }
        

        console.log("session", req.session.referalCode)
        req.session.userOtp = otp;
        req.session.userData = { name, phone, email, password };

        res.render("verify-otp");
        console.log("OTP send : ", otp);

    } catch (error) {
        console.error("Signup error", error);
        res.redirect("/pageNotFound")
    }
}

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)

        return passwordHash
    } catch (error) {

    }
}

const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;

        console.log("otp :", otp, req.session.userOtp);

        if (otp === req.session.userOtp) {
            const user = req.session.userData
            console.log("userr check-",user)

            const passwordHash = await securePassword(user.password);

            const saveUserData = new User({
                name: user.name,
                email: user.email,
                phone: user.phone,
                password: passwordHash,
                refferedCode:req.session.referalCode ? req.session.referalCode : null,
            })

            await saveUserData.save();

            console.log("req sesio",req.session.referalCode)
            // adding referal point to the refered user
            if(req.session.referalCode){
                const referralUser = await User.findOne({referralCode:req.session.referalCode})
                console.log("umbi",referralUser)
                
                if(referralUser){
                    referralUser.referralPoint += 1000;
                    await referralUser.save()
    
                    const refUserWallet = await Wallet.findOne({})
                    if(refUserWallet){
                        console.log("ref wallet",refUserWallet)
                        refUserWallet.balance += 1000;
                        await refUserWallet.save()
                    }
                }
            }

            //console.log("user ref ",referralUser)

            res.json({ success: true, redirectUrl: "/login" })
        }
        else {
            res.status(400).json({ success: false, message:"Invalid OTP, Please try again." })
        }

    } catch (error) {

        console.error("Error Verifying Otp", error);
        res.status(500).json({ success: false, message: "An error occured..!" })

    }
}

const resendOtp = async (req, res) => {
    try {
        const { email } = req.session.userData;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email not found in session" })
        }
        const otp = generateOtp();
        req.session.userOtp = otp;

        const emailSend = await sendVerificationEmail(email, otp)
        if (emailSend) {
            console.log("Resend OTP : ", otp);
            res.status(200).json({ success: true, message: "OTP resend succesfully" })
        } else {
            res.status(500).json({ success: false, message: "Faied to Resend OTP, please try again" })
        }
    } catch (error) {
        console.error("Error resending OTP", error);
        res.status(500).send({ success: false, message: "Internal server error, please try again." })
    }
}

const loadLogin = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.render("login")
        } else {
            res.redirect("/")
        }
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body

        const findUser = await User.findOne({ isAdmin: 0, email });
        if (!findUser) {
            return res.render("login", { message: "User not found" })
        }
        if (findUser.isBlocked) {
            return res.render("login", { message: "User is blocked by admin" })
        }

        const passwordMatch = await bcrypt.compare(password, findUser.password);
        if (!passwordMatch) {
            return res.render("login", { message: "Incorrect password" });
        }

        // dynamically showing wishlist count
        const wishlist = await Wishlist.findOne({userId:findUser._id})
        const wishListCount = wishlist ? req.session.wishListCount = wishlist.products.length : 0;

        // dynamically showing the cartcount
        const cart = await Cart.findOne({userId:findUser._id})
        if(cart){
            req.session.cartCount = cart.items.length;
        }
        else{
            req.session.cartCount = 0;
        }

        req.session.user = { _id: findUser._id, name: findUser.name ,email:findUser.email}
     
        // creating a wallet for user
        let wallet =await Wallet.findOne({userId:req.session.user._id})
        if(!wallet){
            wallet = new Wallet({
                userId:req.session.user._id,
                balance:0,
            })

           await wallet.save()
        }
        console.log("count",req.session.cartCount,req.session.wishListCount)
        res.redirect("/")
    } catch (error) {
        console.error("Login error", error);
        res.render("login", { message: "Login failed, please try again later" })
    }
}


const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log("Session destuction error", err.message);
                return res.redirect("/pageNotFound");
            }
            return res.redirect("/login")
        })
    } catch (error) {
        console.log("Logout Error");
        res.redirect("/pageNotFound")
    }
}


const shoppingPage = async(req,res)=>{
    try {
        const user = req.session.user;
        const userData = await User.findOne({_id:user});
        const categories = await Category.find({isListed:true});
        const categoryId = categories.map((category) => category._id.toString());
        //console.log("categoryID-",categoryId);
        
        const page = parseInt(req.query.page) || 1;
        const limit =12;
        const skip = (page-1)*limit;
        const products = await Product.find(
            {isBlocked:false,category:{$in:categoryId}}
        ).populate("category", "name categoryOffer").sort({createdOn:-1}).skip(skip).limit(limit);

        const totalProducts =await Product.countDocuments({
            isBlocked:false,
            category:{$in:categoryId},
        });

        const totalPages = Math.ceil(totalProducts / limit);
        const categoryWithId = categories.map(category => ({_id:category._id, name:category.name}))
        
        res.render("shopping-page",{
            user:userData,
            products:products,
            category:categoryWithId,
            totalProducts:totalProducts,
            currentPage:page,
            totalPages:totalPages
        })
    } catch (error) {
        console.error("Error in shopping page",error);
        
        res.redirect("/pageNotFound")
    }
}

const filterProduct = async (req,res)=>{
    try {
        const user = req.session.user;
        const category = req.query.category;
        console.log("cat :",category)
        // using ternary operator to filter
        const findCategory = category ? await Category.findOne({_id:category}) : null;

        const query ={
            isBlocked:false,
        }

        if(findCategory){
            query.category = findCategory._id
        }

        let findProduct = await Product.find(query).lean();
        findProduct.sort((a,b) => new Date(b.createdOn)-new Date(a.createdOn));

        const categories = await Category.find({isListed:true});
        let itemPerPage = 10;
        let currentPage = parseInt(req.query.page) || 1;
        let startIndex = (currentPage-1)* itemPerPage;
        let endIndex = startIndex + itemPerPage;
        let  totalPages = Math.ceil(findProduct.length/itemPerPage);
        const currentProduct = findProduct.slice(startIndex,endIndex)
        let userData =null;
        if(user){
            userData = await User.findOne({_id:user});
            if(userData){
                const searchEntry={
                     category: findCategory ? findCategory._id:null,
                     searchedOn :new Date()
                }
                userData.searchHistory.push(searchEntry)
                await userData.save();
            }
        }

        req.session.filterProduct = currentProduct;
        res.render("shopping-page",{
            user: userData,
            products: currentProduct,
            category:categories,
            totalPages,
            currentPage,
            selectedCategory:category || null
        })
    } catch (error) {
        res.redirect("/pageNotFound");
        console.error("Error in category functioning",error);
        
    }
}


// const filterByPrice = async (req, res) => {
//     try {
//         const user = req.session.user;
//         const userData = await User.findOne({ _id: user });
//         const categories = await Category.find({ isListed: true }).lean();
//         const categoryListed =categories.map(category=> category._id)

//         let minPrice = parseFloat(req.query.gt) || 0;
//         let maxPrice = parseFloat(req.query.lt) || Number.MAX_SAFE_INTEGER;
//         let sortOption = {};

//         if (req.query.sort === "lowToHigh") {
//             sortOption = { salePrice: 1 };
//         } else if (req.query.sort === "highToLow") {
//             sortOption = { salePrice: -1 };
//         }

//         let itemPerPage = 9;
//         let currentPage = parseInt(req.query.page) || 1;

//         let findProducts = await Product.find({
//             salePrice: { $gt: minPrice, $lt: maxPrice },
//             isBlocked: false,
//             category:{$in:categoryListed}
//         })
//         .sort(sortOption)
//         .skip((currentPage - 1) * itemPerPage)
//         .limit(itemPerPage)
//         .lean();

//         // Get total products count for pagination
//         let totalProducts = await Product.countDocuments({
//             salePrice: { $gt: minPrice, $lt: maxPrice },
//             isBlocked: false,
//             category:{$in:categoryListed}
//         });

//         let totalPages = Math.ceil(totalProducts / itemPerPage);

//         res.render("shopping-page", {
//             user: userData,
//             products: findProducts,
//             category: categories,
//             totalPages,
//             currentPage
//         });
//     } catch (error) {
//         console.error("Error in filterByPrice:", error);
//         res.redirect("/pageNotFound");
//     }
// };


const filterByPrice = async (req, res) => {
    try {
        const user = req.session.user;
        const userData = await User.findOne({ _id: user });
        const categories = await Category.find({ isListed: true }).lean();
        const categoryListed = categories.map(category => category._id);

        let minPrice = parseFloat(req.query.gt) || 0;
        let maxPrice = parseFloat(req.query.lt) || Number.MAX_SAFE_INTEGER;
        let sortOrder = req.query.sort === "lowToHigh" ? 1 : -1;

        let itemPerPage = 9;
        let currentPage = parseInt(req.query.page) || 1;

        //calculate currentPrice and sort/filter products
        const findProducts = await Product.aggregate([
            {
                $match: {
                    salePrice: { $gt: minPrice, $lt: maxPrice },
                    isBlocked: false,
                    category: { $in: categoryListed }
                }
            },
            {
                $addFields: {
                    currentPrice: {
                        $subtract: ["$salePrice", "$offerAmount"]
                    }
                }
            },
            {
                $match: {
                    currentPrice: { $gte: minPrice, $lte: maxPrice }
                }
            },
            {
                $sort: { currentPrice: sortOrder }
            },
            {
                $skip: (currentPage - 1) * itemPerPage
            },
            {
                $limit: itemPerPage
            }
        ]);

        // Count total products for pagination
        const totalProductsCount = await Product.aggregate([
            {
                $match: {
                    salePrice: { $gt: minPrice, $lt: maxPrice },
                    isBlocked: false,
                    category: { $in: categoryListed }
                }
            },
            {
                $addFields: {
                    currentPrice: {
                        $subtract: ["$salePrice", "$offerAmount"]
                    }
                }
            },
            {
                $match: {
                    currentPrice: { $gte: minPrice, $lte: maxPrice }
                }
            }
        ]);

        let totalPages = Math.ceil(totalProductsCount.length / itemPerPage);

        
        res.render("shopping-page", {
            user: userData,
            products: findProducts,
            category: categories,
            totalPages,
            currentPage
        });
    } catch (error) {
        console.error("Error in filterByPrice:", error);
        res.redirect("/pageNotFound");
    }
};



const SearchProducts = async(req,res)=>{
    try {
        const user = req.session.user;
        const userData = await User.findOne({_id:user});
        const search = req.body.query;
        console.log("query-",search);
        

        const categories = await Category.find({isListed:true});
        //console.log("categories-",categories);
        
        const categoryId = categories.map(category => category._id.toString());
        console.log("category id -",categoryId);
        console.log("session:",req.session.filterProduct)
        
        let searchResult = [];
        if(req.session.filterProduct && req.session.filterProduct.length > 0){
            console.log("session filter product-",req.session.filterProduct);
            
            searchResult = req.session.filterProduct.filter(product =>
                product.productName.toLowerCase().includes(search.toLowerCase())
            )
        }else{
            searchResult = await Product.find({
                productName: {$regex:".*"+search+".*",$options:"i"},
                isBlocked:false,
                category:{$in:categoryId}
            })
        }
        console.log("search result -",searchResult);
        

        searchResult.sort((a,b)=> new Date(b.createdOn)- new Date(a.createdOn))

        let itemPerPage = 10;
        let currentPage= parseInt(req.query.page) || 1;
        let startIndex = (currentPage-1)* itemPerPage;
        let endIndex = startIndex + itemPerPage;
        let totalPages= Math.ceil(searchResult.length / itemPerPage);
        
        const currentProduct = searchResult.slice(startIndex,endIndex);
        console.log("current product-",currentProduct);
        

        res.render("shopping-page",{
            user:userData,
            products:currentProduct,
            category:categories,
            totalPages,
            currentPage,
            count : searchResult.length
        })
    } catch (error) {
        console.error("Error in search product",error);
        res.redirect("/pageNotFound")
        
    }
}


const filterByName = async (req, res) => {
    try {
        const user = req.session.user;
        const Order = req.query.sort;

        const userData = await User.findById(user._id);

        const categories = await Category.find({ isListed: true });
        const categoryListed = categories.map(category => category._id)
         console.log("categories-", categoryListed);

        let products;
        if (Order === "aA-zZ") {
            products = await Product.find({isBlocked:false,category:{$in:categoryListed}}).collation({ locale: 'en' }).sort({ productName: 1 });
        } else if (Order === "zZ-aA") {
            products = await Product.find({isBlocked:false,category:{$in:categoryListed}}).collation({ locale: 'en' }).sort({ productName: -1 });
        }else if(Order === "featured"){
            products =await Product.find({isBlocked:false,category:{$in:categoryListed}})
        }
         else {
            products =await Product.find({isBlocked:false,category:{$in:categoryListed} });
        }
        //console.log("product-", products);

        const itemPerPage = 12;
        const currentPages = parseInt(req.query.page) || 1;
        const totalProducts = await Product.countDocuments({ isBlocked: false });
        const totalPages = Math.ceil(totalProducts / itemPerPage);

        res.render("shopping-page", {
            user: userData,
            products,
            category: categories,
            currentPage:currentPages,
            totalPages
        });

    } catch (error) {
        console.error("Error in product filtering by alphabetic order", error);
        res.redirect("/pageNotFound");
    }
};


module.exports = {
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup,
    verifyOtp,
    resendOtp,
    loadLogin,
    login,
    logout,
    shoppingPage,
    filterProduct,
    filterByPrice,
    SearchProducts,
    filterByName
}