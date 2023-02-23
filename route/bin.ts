import { verifyAdminToken, verifyTokenAndPermission, verifyToken } from "./verifyToken";
import express from 'express'
import { BinModel } from "../mongo/Bin";
import { ManageModel } from "../mongo/Manage";
import { Types } from "mongoose";
import Bin from "../models/Bin";

const router = express.Router();

//update bin - binId
router.put('/:id', verifyAdminToken, async (req, res) => {
    const binResp = await BinModel.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true },
    );
    res.status(200).json(binResp?._doc);
});

//get bin - userId
router.get('/get-bins-by-user-id', verifyAdminToken, async (req, res) => {
    const userId = req.query.userId;
    if (!userId)
        return res.status(402).json('Missing param');
    try {
        const queryResp = await ManageModel.find({ userId }).populate('binId');
        res.status(200).json(queryResp.map((manageMap: any) => ({ userId, ...manageMap?.binId?._doc, _id: manageMap._id, binId: manageMap?.binId?._id })));

    } catch (error) {
        console.log(error)
        res.status(401).json('get bins Failed');
    }
});

//get bin - binId
router.get('/:id', verifyToken, async (req, res) => {
    const bin = await BinModel.findById(req.params.id);
    res.status(200).json(bin?._doc);
});

//get all bins
router.get('/', verifyAdminToken, async (req, res) => {
    const offset = req.query.offset ?? 0;
    const limit = req.query.limit ?? 0;
    const query = BinModel.find().sort({ createAt: "desc" }).skip(offset).limit(limit);

    query.exec((err, bins) => {
        if (err)
            return res.status(400).json('Get List bins Failed');
        const binResp = bins.map(bin => bin._doc);
        binResp.forEach(bin => {
            BinModel.findByIdAndUpdate(bin._id,
                { $set: { status: 1 } },)
        })
        res.status(200).json(binResp);
    });
});

//delete bin - binId
router.post('/delete-bins-by-ids', verifyAdminToken, async (req, res) => {
    const binIds: string[] = req.body?.ids;
    if (!binIds?.length)
        return res.status(200).json([]);
    try {
        const bin = await BinModel.deleteMany({ _id: { $in: binIds.map(id => new Types.ObjectId(id)) } });
        res.status(200).json(bin);
    } catch (err) {
        console.log(err);
        res.status(403).json('Delete bin Failed');
    }
});

//create bin
router.post('/', verifyAdminToken, async (req, res) => {
    const model = new Bin({
        ...req.body,
    });

    try {
        const { organics = [], inorganics = [], recyclables = [] } = model;
        const dateNum = Math.max(organics?.length ?? 0, inorganics?.length ?? 0, recyclables?.length ?? 0);
        model.total = new Array(dateNum).fill(0).map((_, idx) => (organics[idx] ?? 0) + (inorganics[idx] ?? 0) + (recyclables[idx] ?? 0));
        const bin = await (new BinModel(model)).save();
        res.status(200).json(bin)
    } catch (error) {
        console.log(error)
        res.status(401).json('Add bin Failed');
    }
});


export default router;