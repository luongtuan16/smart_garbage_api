import { Document, model, Schema, Model } from 'mongoose';
import Bin from '../models/Bin';

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
    organics: { type: [Number] },
    inorganics: { type: [Number] },
    recyclables: { type: [Number] },
    total: { type: [Number] },
},
    { timestamps: true });

export const BinModel = model('Bin', binSchema);