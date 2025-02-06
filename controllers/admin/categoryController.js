const Category = require("../../models/categorySchema");


const categoryInfo = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5
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
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ error: "Category already exists" });
        }

        const newCategory = new Category({
            name,
            description,
        });
        await newCategory.save();
        console.log("New category added:", newCategory);
        return res.json({ message: "Category added successfully" });
    } catch (error) {
        console.error("Error adding category:", error);
        return res.status(500).json({ error: "Internal server error" });
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
        const existingCategory = await Category.findOne({ name: categoryName });

        // checking existing name 
        if (existingCategory) {
            return res.status(400).json({ error: "Category exist, Please choose another Name." })
        }

        //update category
        const updateCategory = await Category.findByIdAndUpdate(id, {
            name: categoryName,
            description: description
        },
            { new: true }); // return updation immediately

        if (updateCategory) {
            res.status(200).json({ message: "Category updated successfully" });
            //res.redirect("/admin/category")
        } else {
            res.status(400).json({ error: "Category Not found" })
        }

    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ error: "Internal server error" })

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

        res.status(200).send("Category offer added successfully")
        console.log("category offer added succesfully")
    } catch (error) {
        console.error("Error in adding cat offer", error);
        res.status(500).send("Error while adding  category offer")
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

        res.status(200).send("Category Offer Updated Successfully.")
        console.log("category offer updated succesfully");

    } catch (error) {
        console.error("Error in updating cat offer");
        res.status(500).send("Error in updating category offer")
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
        res.status(500).json({ success: false, message: "Server Error..!" })
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