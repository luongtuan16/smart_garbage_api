import CryptoJs from 'crypto-js';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { UserModel } from '../mongo/User';

const router = express.Router();

//register
router.post('/register', async (req, res) => {
    const reqBody = <User>req.body;
    if (!reqBody.username || !reqBody.password)
        return res.status(401).json('Missing param');

    const checkUser = await UserModel.findOne({ username: reqBody.username });
    if (checkUser)
        return res.status(301).json('User existed');
    const userModel = new UserModel({
        ...reqBody,
        password: CryptoJs.AES.encrypt(reqBody.password, process.env.SECRET_KEY)
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