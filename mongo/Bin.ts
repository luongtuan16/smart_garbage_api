import { Document, model, Schema, Model } from 'mongoose';
import Bin from '../models/Bin';
import { STATUS_BIN_ACTIVE } from '../utils/constants';

interface BinDocument extends Bin, Document {
    _id: any;
    _doc?: any;
}

const binSchema = new Schema<BinDocument, Model<BinDocument>>({
    name: { type: String, required: true },
    address: { type: String, required: true },
    image: { type: String },
    lat: { type: Number, required: true },
    long: { type: Number, required: true },
},
    { timestamps: true });

export const BinModel = model('Bin', binSchema);