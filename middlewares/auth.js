const User = require("../models/userSchema");


const userAuth = (req, res, next) => {
    if (req.session.user) {
        User.findById(req.session.user)
            .then(data => {
                if (data) {
                    if (!data.isBlocked) {
                        next();
                    } else {
                        req.session.destroy(() => {
                            res.redirect("/login");
                        });
                    }
                } else {
                    res.redirect("/login");
                }
            })
            .catch(error => {
                console.log("Error in userAuth middleware", error);
                res.status(500).send("Internal server error");
            });
    } else {
        res.redirect("/login");
    }
};

const adminAuth = (req, res, next) => {
    if (req.session.admin) {
        User.findOne({ isAdmin: true })
            .then(data => {
                if (data) {
                    next()
                } else {
                    return res.redirect("/admin/login")
                }
            })
            .catch(error => {
                console.error("Error in Login Admin panel", error)
                res.status(500).send("Internal Server Error..")
            })
    } else {
        console.log("Un Authorized access attempt")
        res.redirect("/admin/login")
    }
}





module.exports = {
    userAuth,
    adminAuth,
    // errorHandlingMid
}