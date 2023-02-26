import { Types } from "mongoose";
import cron from "node-cron";
import Bin from "../models/Bin";
import { BinModel } from "../mongo/Bin";
import { TrashModel } from "../mongo/Trash";
import { datesAreOnSameDay } from "./utils";

export const jobTakeOutTrash = cron.schedule('*/5 * * * *', async () => {//every 5 min
    //const numBin = Math.round(Math.random() * 3) + 1;
    const numBin = 1;
    const getRandomTrash = () => {
        const ran = Math.random();
        return ran >= 0.5 ? Math.round(ran * 200 - 100) : 0;
    }
    const organic = getRandomTrash();
    const inorganic = getRandomTrash();
    const recyclable = getRandomTrash();
    if (!organic && !inorganic && !recyclable)
        return;
    try {
        const binsToUpdate: Bin[] = await BinModel.aggregate().match({})
            .sample(numBin).project({ "_id": 1 });
        if (!binsToUpdate.length)
            return;
        const binId = binsToUpdate[0]._id;
        console.log({ organic, inorganic, recyclable, binId });
        const trashes = await TrashModel.find({ binId: new Types.ObjectId(binId) }).sort({ createdAt: "desc" }).limit(1);
        if (trashes.length) {
            const trash = trashes[0];
            const timeNow = Date.now();
            if (datesAreOnSameDay(new Date(timeNow), new Date(trash.createdAt))) {
                //same day => update record
                await TrashModel.findByIdAndUpdate(trash._id,
                    {
                        $set: {
                            organic: organic + trash.organic <= 100 ? organic + trash.organic : trash.organic,
                            inorganic: inorganic + trash.inorganic <= 100 ? inorganic + trash.inorganic : trash.inorganic,
                            recyclable: recyclable + trash.recyclable <= 100 ? recyclable + trash.recyclable : trash.recyclable,
                        }
                    }, { new: true });
            } else {//another day => new record 
                await TrashModel.create({
                    binId,
                    organic: organic + trash.organic <= 100 ? organic + trash.organic : trash.organic,
                    inorganic: inorganic + trash.inorganic <= 100 ? inorganic + trash.inorganic : trash.inorganic,
                    recyclable: recyclable + trash.recyclable <= 100 ? recyclable + trash.recyclable : trash.recyclable,
                });
            }
        } else {
            await TrashModel.create({
                binId,
                organic,
                inorganic,
                recyclable
            });
        }
    } catch (error) {
        console.log(error);
    }
}, {
    scheduled: true,
    timezone: "Asia/Bangkok"
});

//reset all bin at 22h each day
export const jobClearBin = cron.schedule('00 00 22 * * *', async () => {
    try {
        const allBins: Bin[] = await BinModel.aggregate().match({}).project({ "_id": 1 });
        if (allBins.length) {
            await TrashModel.insertMany(allBins.map(bin => ({
                binId: bin._id,
                organic: 0,
                inorganic: 0,
                recyclable: 0,
            })));
        }
        console.log("clear bins")
    } catch (error) {
        console.log(error);
    }
}, {
    scheduled: true,
    timezone: "Asia/Bangkok"
});
