const User = require("../../models/userSchema");

// Fetch and render customer data
const customerInfo = async (req, res) => {
    try {
        let search = req.query.search || "";
        let page = parseInt(req.query.page) || 1;
        const limit = 10;

        const userData = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } }
            ]
        })
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();

        const count = await User.countDocuments({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } }
            ]
        });

        res.render("customers", {
            data: userData,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            search: search
        });
    } catch (error) {
        console.error(error);
        res.redirect("/admin/pageerror");
    }
};

// Block a customer
const customerBlocked = async (req, res) => {
    try {
        let id = req.query.id;
        await User.updateOne({ _id: id }, { $set: { isBlocked: true } });
        res.redirect(`/admin/users?search=${req.query.search || ""}&page=${req.query.page || 1}`);
    } catch (error) {
        console.error(error);
        res.redirect("/admin/pageerror");
    }
};

// Unblock a customer
const customerunBlocked = async (req, res) => {
    try {
        let id = req.query.id;
        await User.updateOne({ _id: id }, { $set: { isBlocked: false } });
        res.redirect(`/admin/users?search=${req.query.search || ""}&page=${req.query.page || 1}`);
    } catch (error) {
        console.error(error);
        res.redirect("/admin/pageerror");
    }
};


module.exports = {
    customerInfo,
    customerBlocked,
    customerunBlocked
};
