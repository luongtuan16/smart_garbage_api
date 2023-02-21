import CryptoJs from 'crypto-js';
import express from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../mongo/User';

const router = express.Router();

//register
router.post('/register', async (req, res) => {
    const userModel = new UserModel({
        ...req.body,
        password: CryptoJs.AES.encrypt(req.body.password, process.env.SECRET_KEY)
    });

    try {
        const savedUser = await userModel.save();
        return res.status(200).json(savedUser);
    } catch (error) {
        return res.status(500).json(error);
    }
});

//login
router.post('/login', async (req, res) => {
    try {
        const user = await UserModel.findOne({ username: req.body.username });
        if (!user)
            return res.status(500).json('User not exist');
        const hashedPassword = CryptoJs.AES.decrypt(
            user.password,
            process.env.SECRET_KEY
        );
        const originalPassword = hashedPassword.toString(CryptoJs.enc.Utf8);

        try {
            if (originalPassword !== req.body.password)
                return res.status(500).json('Wrong password');
        } catch (error) {
            console.log('Exception when comparing password');
            return res.status(500).json('Wrong password');
        }

        const { password, ...others } = user._doc;

        const accessToken = jwt.sign({
            id: user._id,
            isAdmin: user.isAdmin,
        },
            process.env.JWT_KEY,
            { expiresIn: '3d' });

        return res.status(200).json({ ...others, token: accessToken });

    } catch (error) {
        return res.status(500).json(error);
    }
});


export default router;