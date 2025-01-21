
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userSchema");
const Wallet = require("../models/walletSchema")
const env = require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIEND_ID,
      clientSecret: process.env.GOOGLE_CLIEND_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await User.findOne({ email: profile.emails[0].value });

        console.log("authy",profile)
        if (existingUser && !existingUser.googleId) {
          // Email is registered but not with Google
          return done(null, false, { message: "Email already registered. Please log in using credentials." });
        }

        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User exists, proceed
          return done(null, user);
        } else if (!existingUser) {
          // New Google user, create and save
          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
          });
          await user.save();
          console.log("id--",user._id)
          let wallet = await Wallet.findOne({userId:user._id})
          console.log("wall",wallet);
          if(!wallet){
            wallet = new Wallet({
              userId:user._id,
              balance:0
            })

            await wallet.save();
            console.log("wallet created for auth user")
          }
          
          return done(null, user);
        }
      } catch (err) {
        return done(err, null);
      }
    }
  )
);


passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => done(null, user))
    .catch((err) => done(err, null));
});

module.exports = passport;


