const Category = require("../../models/categorySchema");
const STATUS_CODE = require("../../constants/statuscode");
const MESSAGES = require("../../constants/messages");


const categoryInfo = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10
        const skip = (page - 1) * limit

        const categoryData = await Category.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / limit);

        res.render("category", {
            cat: categoryData,
            currentPage: page,
            totalPages: totalPages,
            totalCategories: totalCategories
        });
    } catch (error) {
        console.error(error);
        res.redirect("/pageerror");
    }
}


const addCategory = async (req, res) => {
    const { name, description } = req.body;
    try {
        const existingCategory = await Category.findOne({ name: { $regex: ".*" + name + ".*", $options: "i" } });
        console.log("name",existingCategory)
        if (existingCategory) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({ error: MESSAGES.CATEGORY_ALREADY_EXISTS });
        }

        const newCategory = new Category({
            name,
            description,
        });
        await newCategory.save();
        console.log("New category added:", newCategory);
        return res.json({ message: MESSAGES.CATEGORY_ADDED_SUCCESS });
    } catch (error) {
        console.error("Error adding category:", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const listCategory = async (req, res) => {
    try {
        let id = req.body.id;
        console.log("id",id)
        await Category.updateOne({ _id: id }, { $set: { isListed: true } });
        res.json({success:true})
    } catch (error) {
        res.redirect("/pageerror")
    }
}

const unlistCategory = async (req, res) => {
    try {
        let id = req.body.id;
        console.log("id2",id)
        await Category.updateOne({ _id: id }, { $set: { isListed: false } });
        res.json({success:true})
    } catch (error) {
        res.redirect("/pageerror")
    }
}


const editCategory = async (req, res) => {
    try {
        const id = req.query.id;
        const category = await Category.findOne({ _id: id })
        res.render("edit-category", { category: category })
    } catch (error) {
        res.redirect("/pageerror")
    }
}

const updateCategory = async (req, res) => {
    try {

        const id = req.params.id;
        const { categoryName, description } = req.body;
        const existingCategory = await Category.findOne({
            name: {$regex: ".*"+ categoryName +".*",$options: "i"},
            _id: { $ne: id } // Exclude the current category 
        });

        // checking existing name 
        if (existingCategory) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({ error: MESSAGES.CATEGORY_ALREADY_EXISTS })
        }

        //update category
        const updateCategory = await Category.findByIdAndUpdate(id, {
            name: categoryName,
            description: description
        },
            { new: true }); // return updation immediately

        if (updateCategory) {
            res.status(STATUS_CODE.OK).json({ message: MESSAGES.CATEGORY_UPDATED_SUCCESS });
            //res.redirect("/admin/category")
        } else {
            res.status(STATUS_CODE.BAD_REQUEST).json({ error: "Category Not found" })
        }

    } catch (error) {
        console.error("Error updating category:", error);
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: MESSAGES.INTERNAL_SERVER_ERROR })

    }
}


const addOffer = async (req, res) => {
    try {
        const { categoryId, amount } = req.body;
        console.log("cat id-", categoryId);
        console.log("amount - ", amount)
        const category = await Category.findById(categoryId);
        console.log("cat -", category);

        category.categoryOffer = amount;
        category.save();

        res.status(STATUS_CODE.OK).send(MESSAGES.CATEGORY_OFFER_ADDED_SUCCESS)
        console.log("category offer added succesfully")
    } catch (error) {
        console.error("Error in adding cat offer", error);
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).send(MESSAGES.ERROR_ADDING_CATEGORY_OFFER)
    }
}


const editOffer = async (req, res) => {
    try {
        const { categoryId, amount } = req.body;
        console.log("body ", req.body);

        const category = await Category.findById(categoryId);
        console.log("cat - ", category);

        category.categoryOffer = amount;
        category.save();

        res.status(STATUS_CODE.OK).send(MESSAGES.CATEGORY_OFFER_UPDATED_SUCCESS)
        console.log("category offer updated succesfully");

    } catch (error) {
        console.error("Error in updating cat offer");
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).send(MESSAGES.ERROR_UPDATING_CATEGORY_OFFER)
    }
}


const removeOffer = async (req, res) => {
    try {
        const categoryId = req.query.categoryId;
        console.log("cat id 1", categoryId);

        const category = await Category.findById(categoryId)
        console.log("cat 1 ", category);


        category.categoryOffer = 0;
        category.save()

        res.redirect("/admin/category");
        console.log("category offer removed succssfully")
    } catch (error) {
        console.error("Error in removing category");
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SERVER_ERROR_ALT })
    }
}



module.exports = {
    categoryInfo,
    addCategory,
    listCategory,
    unlistCategory,
    editCategory,
    updateCategory,
    addOffer,
    editOffer,
    removeOffer
}