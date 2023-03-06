import express from "express";
import mongoose from 'mongoose';

import userRoute from './route/user';
import authRoute from './route/auth';
import manageRoute from './route/manage';
import binRoute from './route/bin';

import bodyParser from 'body-parser';
import cors from 'cors';
import { startAMQPConsumer } from "./utils/amqp";
import { jobTakeOutTrash } from "./utils/cron";

const app = express();

app.use(cors({
    origin: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


require('dotenv').config();

mongoose.connect(process.env.MONGO_URL ?? '')
    .then(() => {
        console.log('DB connect successfully');
    })
    .catch(error => {
        console.log(error);
    })

app.use('/api/user', userRoute);
app.use('/api/auth', authRoute);
app.use('/api/manage', manageRoute);
app.use('/api/bin', binRoute);

app.listen(process.env.PORT, () => {
    console.log(`Example app listening on port ${process.env.PORT}`)
});

//startAMQPConsumer();
jobTakeOutTrash.start();