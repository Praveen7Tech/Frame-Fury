const User = require("../models/userSchema");

const getUserId = (sessionUser) => {
    if (!sessionUser) return null;
    if (typeof sessionUser === "string") return sessionUser;
    if (typeof sessionUser === "object") return sessionUser._id || sessionUser.id || null;
    return null;
};

const userAuth = (req, res, next) => {
    const userId = getUserId(req.session.user);

    if (!userId) {
        if (req.xhr || (req.headers.accept && req.headers.accept.includes("application/json"))) {
            return res.status(401).json({
                success: false,
                message: "Please log in to continue",
                redirectUrl: "/login"
            });
        }

        if (req.originalUrl && req.originalUrl !== "/login") {
            req.session.returnTo = req.originalUrl;
        }

        return res.redirect("/login");
    }

    User.findById(userId)
        .then((data) => {
            if (data) {
                if (!data.isBlocked) {
                    req.user = data;
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
        .catch((error) => {
            console.log("Error in userAuth middleware", error);
            res.status(500).send("Internal server error");
        });
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
}