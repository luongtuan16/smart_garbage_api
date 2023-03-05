import express from 'express';
import moment from "moment";
import { Types } from "mongoose";
import Bin from "../models/Bin";
import Trash from "../models/Trash";
import { BinModel } from "../mongo/Bin";
import { ManageModel } from "../mongo/Manage";
import { TrashModel } from "../mongo/Trash";
import { datesAreOnSameDay } from "../utils/utils";
import { verifyAdminToken, verifyToken } from "./verifyToken";

const router = express.Router();

//update bin - binId
router.put('/:id', verifyAdminToken, async (req, res) => {
    try {
        const binResp = await BinModel.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true },
        );
        res.status(200).json(binResp?._doc);
    } catch (error) {
        console.log(error);
        res.status(200).json("Update bin fail");
    }
});

//get bin - userId
router.get('/get-bins-by-user-id', verifyToken, async (req, res) => {
    const userId = req.query.userId;
    if (!userId)
        return res.status(402).json('Missing param');
    try {
        const queryResp = await ManageModel.find({ userId }).populate('binId');
        if (!queryResp.length)
            return res.status(200).json([]);
        const response = queryResp.map((manageMap: any) =>
        ({
            userId, ...manageMap?.binId?._doc,
            _id: manageMap._id,
            binId: manageMap?.binId?._id
        })
        );
        await Promise.all(queryResp.map(async (manage, idx) => {
            const currentTrash = await TrashModel.find({ binId: manage.binId }).sort({ createdAt: "desc" }).limit(1);
            response[idx] = {
                ...response[idx],
                organic: currentTrash[0]?.organic ?? 0,
                inorganic: currentTrash[0]?.inorganic ?? 0,
                recyclable: currentTrash[0]?.recyclable ?? 0,
            }
        }));
        res.status(200).json(response);
    } catch (error) {
        console.log(error);
        res.status(401).json('Get Bins by userId Failed');
    }
});

//get bin - binId
router.get('/:id', verifyToken, async (req, res) => {
    const bin = await BinModel.findById(req.params.id);
    if (!bin)
        return res.status(301).json("Bin not exist");
    const currentTrash = await TrashModel.find({ binId: bin._id }).sort({ createdAt: "desc" }).limit(1);
    if (!currentTrash.length)
        return res.status(200).json({
            ...bin._doc,
            organic: 0,
            inorganic: 0,
            recyclable: 0,
        });
    return res.status(200).json({
        ...bin._doc,
        organic: currentTrash[0].organic,
        inorganic: currentTrash[0].inorganic,
        recyclable: currentTrash[0].recyclable,
    });
});

//get all bins
router.get('/', verifyToken, async (req, res) => {
    const offset = Number(req.query.offset) ?? 0;
    const limit = Number(req.query.limit) ?? 0;
    try {
        const binResp = await BinModel.find().sort({ createAt: "desc" }).skip(offset).limit(limit);
        const bins = binResp.map(item => item._doc);
        await Promise.all(binResp.map(async (bin, idx) => {
            const currentTrash = await TrashModel.find({ binId: bin._id }).sort({ createdAt: "desc" }).limit(1);
            bins[idx] = {
                ...bins[idx],
                organic: currentTrash[0]?.organic ?? 0,
                inorganic: currentTrash[0]?.inorganic ?? 0,
                recyclable: currentTrash[0]?.recyclable ?? 0,
            }
        }));
        return res.status(200).json(bins);
    } catch (error) {
        console.log(error)
        return res.status(400).json('Get List bins Failed');
    }
});

//add trash random
router.post('/add-trash', verifyAdminToken, async (req, res) => {
    const numBin = Math.round(Math.random() * 3) + 1;
    const getRandomTrash = () => {
        const ran = Math.random();
        return ran >= 0.5 ? Math.round(ran * 200 - 100) : 0;
    }
    const organic = getRandomTrash();
    const inorganic = getRandomTrash();
    const recyclable = getRandomTrash();
    if (!organic && !inorganic && !recyclable)
        return res.status(200).json("Zero trash");
    try {
        const binsToUpdate: Bin[] = await BinModel.aggregate().match({})
            .sample(numBin).project({ "_id": 1 });
        if (!binsToUpdate.length)
            return res.status(200).json("NO bin");
        const binId = binsToUpdate[0]._id;
        const trashes = await TrashModel.find({ binId: new Types.ObjectId(binId) }).sort({ createdAt: "desc" }).limit(1);
        if (trashes.length) {
            const trash = trashes[0];
            const timeNow = Date.now();
            if (datesAreOnSameDay(new Date(timeNow), new Date(trash.createdAt))) {
                //same day => update record
                const updateTrash = await TrashModel.findByIdAndUpdate(trash._id,
                    {
                        $set: {
                            organic: organic + trash.organic <= 100 ? organic + trash.organic : trash.organic,
                            inorganic: inorganic + trash.inorganic <= 100 ? inorganic + trash.inorganic : trash.inorganic,
                            recyclable: recyclable + trash.recyclable <= 100 ? recyclable + trash.recyclable : trash.recyclable,
                        }
                    }, { new: true });
                return res.status(200).json(updateTrash);
            } else {//another day => new record 
                const newTrash = await TrashModel.create({
                    binId,
                    organic: organic + trash.organic <= 100 ? organic + trash.organic : trash.organic,
                    inorganic: inorganic + trash.inorganic <= 100 ? inorganic + trash.inorganic : trash.inorganic,
                    recyclable: recyclable + trash.recyclable <= 100 ? recyclable + trash.recyclable : trash.recyclable,
                });
                return res.status(200).json(newTrash);
            }
        } else {
            const newTrash = await TrashModel.create({
                binId,
                organic,
                inorganic,
                recyclable
            });
            return res.status(200).json(newTrash);
        }
    } catch (error) {
        console.log(error);
        res.status(401).json('Add trash Failed');
    }
});

//clear all bin
router.post('/clear-bin', verifyAdminToken, async (req, res) => {
    try {
        const allBins: Bin[] = await BinModel.aggregate().match({}).project({ "_id": 1 });
        if (allBins.length) {
            const result = await TrashModel.insertMany(allBins.map(bin => ({
                binId: bin._id,
                organic: 0,
                inorganic: 0,
                recyclable: 0,
            })));
            return res.status(200).json(result);
        }
        return res.status(200).json(0);
    } catch (error) {
        console.log(error);
        res.status(401).json('clear trash Failed');
    }
});

//statistic trash
router.post('/statistic-trash', verifyToken, async (req, res) => {
    const binIds: string[] = req.body.binIds ?? [];
    const numDay = req.body.numDay ?? 10;
    try {
        const queryResp = await BinModel.find({ _id: { $in: binIds.map(id => new Types.ObjectId(id)) } });
        if (!queryResp.length)
            return res.status(200).json([]);
        const bins = queryResp.map(resp => resp._doc);
        const startDay = moment().subtract(numDay - 1, 'd');
        const beginOfTheDay = moment(startDay).startOf('day').toDate();

        const trashesResp: Trash[] = await TrashModel.find({
            binId: { $in: bins.map(item => new Types.ObjectId(item._id)) },
            createdAt: { $gte: beginOfTheDay }
        }).sort({ createdAt: "desc" });

        const statisticDays = new Array(numDay).fill(0).map((_, idx) => moment().subtract(idx, 'd').toDate());

        return res.status(200).json(bins.map(bin => {
            const trashesStatisticOfBin = trashesResp.filter(item => item.binId.toString() === bin._id.toString());
            const organics: number[] = [];
            const inorganics: number[] = [];
            const recyclables: number[] = [];
            statisticDays.forEach(day => {
                const total1 = trashesStatisticOfBin.filter(trash => datesAreOnSameDay(trash.createdAt, day));
                //console.log(total1.length)
                const total = total1.reduce((prev, curTrash) => ({
                    organic: prev.organic + curTrash.organic,
                    inorganic: prev.inorganic + curTrash.inorganic,
                    recyclable: prev.recyclable + curTrash.recyclable,
                }), { organic: 0, inorganic: 0, recyclable: 0 });
                // console.log(total)
                organics.push(total.organic);
                inorganics.push(total.inorganic);
                recyclables.push(total.recyclable);
            });
            return {
                ...bin,
                organics,
                inorganics,
                recyclables
            }
        }));

    } catch (error) {
        console.log(error);
        res.status(401).json('Statistic Trash Failed');
    }
});

//delete bins - binId
router.post('/delete-bins-by-ids', verifyAdminToken, async (req, res) => {
    const binIds: string[] = req.body?.ids;
    if (!binIds?.length)
        return res.status(200).json([]);
    try {
        const bin = await BinModel.deleteMany({ _id: { $in: binIds.map(id => new Types.ObjectId(id)) } });
        await ManageModel.deleteMany({ binId: { $in: binIds.map(id => new Types.ObjectId(id)) } });
        await TrashModel.deleteMany({ binId: { $in: binIds.map(id => new Types.ObjectId(id)) } });
        res.status(200).json(bin);
    } catch (err) {
        console.log(err);
        res.status(403).json('Delete bins Failed');
    }
});

//create bin
router.post('/', verifyAdminToken, async (req, res) => {
    const model = new Bin({
        ...req.body,
    });

    try {
        const bin = await (new BinModel(model)).save();
        res.status(200).json(bin)
    } catch (error) {
        console.log(error)
        res.status(401).json('Add bin Failed');
    }
});

export default router;