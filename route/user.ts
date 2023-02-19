const router = require('express').Router();
import CryptoJs from 'crypto-js';
import jwt from 'jsonwebtoken';
import { UserModel } from '../mongo/User';
import { verifyAdminToken, verifyTokenAndPermission } from './verifyToken';

//update user info
router.put('/:id', verifyTokenAndPermission, (req, res) => {

    if (req.body.password)
        req.body.password = CryptoJs.AES.
            encrypt(req.body.password, process.env.SECRET_KEY).toString();

    UserModel.findByIdAndUpdate(req.params.id,
        { $set: req.body },
        { new: true },
        (err, user: any) => {
            err && res.status(400).json('Update failed');
            const { password, ...others } = user._doc;
            res.status(200).json(others);
        });

});

//get user info
router.get('/:id', verifyTokenAndPermission, (req, res) => {

    UserModel.findById(req.params.id,
        (err, user) => {
            err && res.status(400).json('Get User Failed');

            const { password, ...others } = user._doc;

            res.status(200).json(others);
        });

});

//get all user info
router.get('/', verifyAdminToken, async (req, res) => {
    const query = req.query.new ? UserModel.find({}).sort({ _id: -1 }).limit(5) : UserModel.find();

    query.exec((err, users) => {
        err && res.status(400).json('Get Users Failed');
        const usersResp = users.map((user: any) => {
            const { password, ...others } = user._doc;
            return others;
        });
        res.status(200).json(usersResp);
    });

});
//delete user
router.delete('/:id', verifyAdminToken, (req, res) => {
    UserModel.findByIdAndDelete(req.params.id,
        (err, data) => {
            err && res.status(400).json('Delete User Failed');
            res.status(200).json(data);
        })
});

export default router;