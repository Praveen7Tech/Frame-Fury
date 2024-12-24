const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { error } = require("console");

const productAddpage = async (req, res) => {
    try {
        const category = await Category.find({ isListed: true });
        res.render("product-add", {
            cat: category
        });
        //console.log("Categories:", category);
    } catch (error) {
        res.redirect("/pageerror");
    }
}

const addProducts = async (req, res) => {
    try {
        console.log("Request Body:", req.body);

        const products = req.body;
        const productExist = await Product.findOne({ productName: products.productName });

        if (!productExist) {
            const images = [];
            if (req.files && req.files.length > 0) {
                for (let i = 0; i < req.files.length; i++) {
                    const originalImagePath = req.files[i].path;

                    const resizedImagePath = path.join("public", "uploads", "re-image", req.files[i].filename);
                    await sharp(originalImagePath).resize({ width: 440, height: 440 }).toFile(resizedImagePath);
                    images.push(req.files[i].filename);
                }
            }

            console.log("Category from frontend:", products.category);

            // Case-insensitive query for category matching
            const categoryId = await Category.findOne({name:products.category});

            console.log("Category Found:", categoryId);

            if (!categoryId) {
                return res.status(400).json("Invalid Category name");
            }

            const newProduct = new Product({
                productName: products.productName,
                description: products.description,
                brand:products.brand,
                category: categoryId._id,
                regularPrice: products.regularPrice,
                salePrice: products.salePrice,
                createdOn: new Date(),
                quantity: products.quantity,
                size:products.size,
                material:products.materials,
                productImage:images,
                status:"Available",
            });

            await newProduct.save();
            return res.redirect("/admin/addProducts");
        } else {
            return res.status(400).json("Product already exists, Please try with another name");
        }
    } catch (error) {
        console.error("Error saving new product", error);
        return res.redirect("/admin/pageerror");
    }
};


const getAllProducts = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = req.query.page || 1;
        const limit = 10;

        
        const productData = await Product.find({
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
            ],
        })
        .sort({createdOn:1})
        .limit(limit)
        .skip((page - 1) * limit)
        .populate("category") 
        .exec();

        const count = await Product.find({
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
            ],
        }).countDocuments();

        const category = await Category.find({ isListed: true });

        if (category) {
            res.render("products", {
                data: productData,
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                cat: category,
            });
        } else {
            res.render("page-404");
        }
    } catch (error) {
        console.error("Error in getAllProducts:", error);
        res.redirect("/admin/pageerror");
    }
};

const blockProduct = async(req,res)=>{
    try {
        const id = req.query.id
        await Product.updateOne({_id:id},{$set:{isBlocked:true}});
        res.redirect("/admin/products")
    } catch (error) {
        res.redirect("/pageerror")
    }
}

const unblockProduct = async(req,res)=>{
    try {
        const id = req.query.id;
        await Product.updateOne({_id:id},{$set:{isBlocked:false}});
        res.redirect("/admin/products")
    } catch (error) {
        res.redirect("/pageerror")
    }
}


const editProduct = async(req,res)=>{
    try {
        const id = req.query.id;
        const product = await Product.findOne({_id:id}).populate("category")
        const category = await Category.find({});
        console.log("Category: ", category)

        res.render("edit-product",{
            product:product,
            cat:category
        })
    } catch (error) {
        console.error("Error in editProduct:", error);
        res.redirect("/pageerror")
    }
}

const updateProduct = async(req,res)=>{
    try {
        const id = req.params.id;
        const data = req.body;
        const product =await Product.findOne({_id:id});
        
        const existingProduct = await Product.findOne({
            producName:data.productName,
            _id:{$ne:id}
        })

        if(existingProduct){
            return res.status(400).json({error:"Product with this name is already exist, Please try with another name"})
        }

        const images =[];

        if(req.files && req.files.length>0){
            for(let i=0;i<req.files.length;i++){
                images.push(req.files[i].filename);
            }
        }

        const updateFields = {
            productName:data.productName,
            description:data.description,
            category:data.category || product.category, 
            regularPrice:data.regularPrice,
            salePrice:data.salePrice,
            quantity:data.quantity,

        }
        if(req.files.length>0){
            updateFields.$push = {productImage:{$each:images}}
        }

        await Product.findByIdAndUpdate(id,updateFields,{new:true})
        res.redirect("/admin/products");

    } catch (error) {
        console.error("Error updating product",error);
        res.redirect("/pageerror")
        
    }
}

const deleteImage = async (req, res) => {
    try {
        const { imageNameToServer, productIdToServer } = req.body;
        const product = await Product.findByIdAndUpdate(productIdToServer, { $pull: { productImage: imageNameToServer } });
        const imagePath = path.join("public", "uploads", "re-image", imageNameToServer);

        if (fs.existsSync(imagePath)) {
            try {
                fs.unlinkSync(imagePath);
                console.log(`Image ${imageNameToServer} deleted successfully`);
            } catch (err) {
                console.error(`Error deleting image: ${err.message}`);
            }
        } else {
            console.log(`Image ${imageNameToServer} not found.`);
        }
        res.send({ status: true });
    } catch (error) {
        console.error("Error in deleteImage:", error);
        res.redirect("/pageerror");
    }
};

const addOffer = async(req,res)=>{
try {
    const {productId, amount} =req.body;

    console.log("product-id",productId);
    console.log("amount -",amount)

    const product = await Product.findById(productId);
    console.log("product - ",product);

    product.offer = amount;
    product.save();

    res.status(200).send("Offer added successfully")
    console.log("offer added successfully")
} catch (error) {
    console.error("error in adding offer",error);
    res.status(500).send("Failed to add offer")
}
}


const editOffer = async(req,res)=>{
    try {
        const {productId, amount} = req.body;
        const product = await Product.findById(productId)

        product.offer = amount;
        product.save();

        res.status(200).send("Poduct offer updated succesfully.")
        console.log("offer updated succesfully.")
    } catch (error) {
        console.error("RError in updating product offer",error);
        res.status(500).send("failed to update product offer");
    }
}


const removeOffer = async(req,res)=>{
    try {
        const productId = req.params.id;
        console.log("product id --",productId)

        const product = await Product.findById(productId)
        console.log("pro-",product)

        product.offer = null;
        product.save();

        res.status(200).json({success:true,message:"Product offer removed successfull.."})
        console.log("product offer removed successfull")
    } catch (error) {
        console.error("Error in remove product offer",error);
        res.status(500).json({success:false,message:"Internal server error"})
    }
}




module.exports = {
    productAddpage,
    addProducts,
    getAllProducts,
    blockProduct,
    unblockProduct,
    editProduct,
    updateProduct,
    deleteImage,
    addOffer,
    editOffer,
    removeOffer
};

