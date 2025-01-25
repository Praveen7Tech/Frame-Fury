const User = require("../../models/userSchema")

const GenerateReferral = async (req, res) => {
    try {
        const userId = req.session.user;
        const { name } = req.body;
        console.log("name-", name);
        console.log("userid-", userId);

        const generateRefferal = `${name.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        console.log("rrefer", generateRefferal);

        const user = await User.findById(userId);
        user.referralCode = generateRefferal;
        await user.save();

        // Respond with the referral code
        res.status(200).json({
            success: true,
            referralCode: user.referralCode // Send the generated referral code
        });

        console.log("Referral Code created successfully..");
    } catch (error) {
        console.error("Error in Creating Referral code", error);
        res.status(500).json({ message: "Internal Server Error..!" });
    }
}



module.exports = {
    GenerateReferral
}