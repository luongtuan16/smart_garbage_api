import { Types } from "mongoose";
import cron from "node-cron";
import Bin from "../models/Bin";
import { BinModel } from "../mongo/Bin";
import { TrashModel } from "../mongo/Trash";
import { sendMessageToBroker } from "./amqp";
import { datesAreOnSameDay } from "./utils";

//reset all bin at 22h each day
export const jobClearBin = cron.schedule('0 22 * * *', async () => {
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

export const jobTakeOutTrash = cron.schedule('*/1 * * * *', async () => {//every 1 min
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
        await sendMessageToBroker(JSON.stringify({ organic, inorganic, recyclable, binId }));
    } catch (error) {
        console.log(error);
    }
}, {
    scheduled: true,
    timezone: "Asia/Bangkok"
});

