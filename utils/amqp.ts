import amqplib from "amqplib";
import { Types } from "mongoose";
import { BinModel } from "../mongo/Bin";
import { ManageModel } from "../mongo/Manage";
import { TrashModel } from "../mongo/Trash";
import { QUEUE_TRASH } from "./constants";
import { datesAreOnSameDay } from "./utils";
import { sendNotification } from "./firebaseApi";

export async function startAMQPConsumer() {
    try {
        const broker = process.env.AMQP_URL || "";
        if (!broker) {
            console.error("AMQP URL invalid");
            return;
        }
        // connect RabbitMQ server
        const connection = await amqplib.connect(broker);
        const channel = await connection.createChannel();

        // define queue
        const queueName = QUEUE_TRASH;
        await channel.assertQueue(queueName, { durable: true });

        // subcribe consumer and handle message
        const options = { noAck: true };
        channel.consume(queueName, async (message) => {
            console.log(`Received message: ${message.content.toString()}`);
            const { binId, organic, inorganic, recyclable } = <{ binId: string, organic: number, inorganic: number, recyclable: number }>
                JSON.parse(message.content.toString());
            if (binId !== undefined && organic !== undefined && inorganic !== undefined && recyclable !== undefined) {// save
                if (organic + inorganic + recyclable >= 240) {//send notification to device
                    const bin = await BinModel.findById(binId);
                    const managements = await ManageModel.find({ binId }).populate('userId');
                    if (managements.length && bin) {
                        const deviceIds = managements.map((manageMap: any) => manageMap?.userId?.deviceId).filter(deviceId => deviceId);
                        const message = `Thùng rác ${bin.name} sắp đầy rồi!`;
                        sendNotification(deviceIds, message);
                    }
                }
                const trashes = await TrashModel.find({ binId: new Types.ObjectId(binId) }).sort({ createdAt: "desc" }).limit(1);
                if (trashes.length) {
                    const trash = trashes[0];
                    const timeNow = Date.now();
                    if (datesAreOnSameDay(new Date(timeNow), new Date(trash.createdAt))) {
                        //same day
                        if (organic === 0 && inorganic === 0 && recyclable === 0
                            && (trash.organic + trash.inorganic + trash.recyclable > 0)) {//bin has just been clear
                            await TrashModel.create({ binId, organic: 0, inorganic: 0, recyclable: 0 });
                        } else {//new trash amount
                            await TrashModel.findByIdAndUpdate(trash._id,
                                {
                                    $set: {
                                        organic: Math.min(organic, 100),
                                        inorganic: Math.min(inorganic, 100),
                                        recyclable: Math.min(recyclable, 100),
                                    }
                                }, { new: true });
                        }
                    } else {//another day => new record 
                        await TrashModel.create({
                            binId,
                            organic: Math.min(organic, 100),
                            inorganic: Math.min(inorganic, 100),
                            recyclable: Math.min(recyclable, 100),
                        });
                    }
                } else {
                    await TrashModel.create({ binId, organic, inorganic, recyclable });
                }
            } else {
                console.log(`Message invalid: ${message.content.toString()}`);
            }
        }, options);
        console.log('Waiting for messages...');
    } catch (error) {
        console.error(error);
    }
}

export async function sendMessageToBroker(message: string) {
    try {
        const broker = process.env.AMQP_URL || "";
        if (!broker) {
            console.error("AMQP URL invalid");
            return null;
        }
        // Connect RabbitMQ server
        const connection = await amqplib.connect(broker);
        const channel = await connection.createChannel();

        // Define queue
        const queueName = QUEUE_TRASH;
        await channel.assertQueue(queueName, { durable: true });

        // Send message
        const options = { persistent: true };
        await channel.sendToQueue(queueName, Buffer.from(message), options);

        // Close connect
        await channel.close();
        await connection.close();
    } catch (error) {
        console.error(error);
    }
}