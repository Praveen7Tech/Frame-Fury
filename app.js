const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
//const flash = require("connect-flash")
const session = require("express-session");
const passport = require("./config/passport")
dotenv.config();
const db = require("./config/db");
const userRoter = require("./routes/userRouter");
const adminRouter = require("./routes/adminRouter")

db();

const app = express();


app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        secure:false,
        httpOnly:true,
        maxAge:72*60*60*1000
    }
}))

// cart & wishlist count is passing to all templates in header
app.use((req, res, next) => {
    res.locals.cartCount = req.session.cartCount || 0;
    res.locals.wishListCount = req.session.wishListCount || 0;
    next();
  });
  

// accessing passport
app.use(passport.initialize());
app.use(passport.session())


app.use((req,res,next)=>{
    res.set("cache-control","no-store")
    next();
})


app.set("view engine","ejs");
app.set("views",[path.join(__dirname,"views/user"), path.join(__dirname,"views/admin")]);
app.use(express.static(path.join(__dirname,"public")))


app.use("/",userRoter)
app.use("/admin",adminRouter)


PORT = process.env.PORT
app.listen(PORT,()=>{
    console.log(`User : http://localhost:${PORT}`);
    console.log(`admin : http://localhost:${PORT}/admin/login`)
})