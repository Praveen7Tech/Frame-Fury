const Category = require("../../models/categorySchema");


const categoryInfo = async(req,res)=>{
    try {
        const page = parseInt(req.session.query);
        const limit = 10
        const skip = (page-1)*limit

        const categoryData = await Category.find({})
        .sort({createdAt: -1})
        .skip(skip)
        .limit(limit);

        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories/limit);

        res.render("category",{
            cat:categoryData,
            currentPage:page,
            totalPages:totalPages,
            totalCategories:totalCategories
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

const listCategory = async(req,res)=>{
    try {
        let id = req.query.id;
        await Category.updateOne({_id:id},{$set:{isListed:false}});
        res.redirect("/admin/category");
    } catch (error) {
        res.redirect("/pageerror")
    }
}

const unlistCategory = async(req,res)=>{
    try {
        let id = req.query.id;
        await Category.updateOne({_id:id},{$set:{isListed:true}});
        res.redirect("/admin/category")
    } catch (error) {
        res.redirect("/pageerror")
    }
}


const editCategory = async (req,res)=>{
    try {
       const id = req.query.id;
       const category = await Category.findOne({_id:id}) 
       res.render("edit-category",{category:category})
    } catch (error) {
       res.redirect("/pageerror") 
    }
}

const updateCategory = async(req,res)=>{
    try {

        const id = req.params.id;
        const {categoryName,description} = req.body;
        const existingCategory = await Category.findOne({name:categoryName});

        // checking existing name 
        if(existingCategory){
            return res.status(400).json({error:"Category exist, Please choose another Name."})
        }

        //update category
        const updateCategory = await Category.findByIdAndUpdate(id,{
            name:categoryName,
            description:description},
            {new:true}); // return updation immediately

        if(updateCategory){
            res.status(200).json({ message: "Category updated successfully" });
           //res.redirect("/admin/category")
        }else{
            res.status(400).json({error:"Category Not found"})
        }
        
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({error:"Internal server error"})
        
    }
}




module.exports = {
    categoryInfo,
    addCategory,
    listCategory,
    unlistCategory,
    editCategory,
    updateCategory
}