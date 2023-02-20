import express from 'express';
import { truncate } from 'fs/promises';
import { Types } from 'mongoose';
import Manage from '../models/Manage';
import { BinModel } from '../mongo/Bin';
import { ManageModel } from '../mongo/Manage';
import { UserModel } from '../mongo/User';
import { verifyAdminToken, verifyToken } from "./verifyToken";
const router = express.Router();

// delete manage by userId and binId
router.post('/delete-manage', verifyToken, async (req, res) => {
    const { binId, userId } = <Manage>req.body;
    if (!binId || !userId)
        return res.status(400).json('Missing param');
    try {
        const delResp = await ManageModel.findOneAndDelete({
            binId, userId
        });
        return res.status(200).json(delResp);
    } catch (error) {
        console.log(error)
        res.status(401).json('Del Manage Failed');
    }
});


// create management
router.post('/', verifyToken, async (req, res) => {
    const { binId, userId } = <Manage>req.body;
    if (!binId || !userId)
        return res.status(400).json('Missing param');
    try {
        const bin = await BinModel.findById(binId);
        const user = await UserModel.findById(userId);

        if (!bin || !user)
            return res.status(402).json('Not exist');

        const newManage = { userId, binId };
        const management = await ManageModel.findOneAndUpdate({ userId, binId }, { $set: {}, $setOnInsert: newManage }, { upsert: true, new: true });
        return res.status(200).json(management)

    } catch (error) {
        console.log(error)
        res.status(401).json('Add Manage Failed');
    }
});

//delete manage by ids
router.post('/delete-managements-by-ids', verifyAdminToken, async (req, res) => {
    const manageIds: string[] = req.body?.ids;
    if (!manageIds?.length)
        return res.status(200).json([]);
    try {
        const manage = await ManageModel.deleteMany({ _id: { $in: manageIds.map(id => new Types.ObjectId(id)) } });
        res.status(200).json(manage);
    } catch (err) {
        console.log(err);
        res.status(403).json('Delete bin Failed');
    }
});

export default router;