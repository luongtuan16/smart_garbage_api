import { Document, model, Model, Schema, Types } from 'mongoose';
import Trash from '../models/Trash';

interface TrashDocument extends Trash, Document {
    _id: any;
    _doc?: any;
}

const trashSchema = new Schema<TrashDocument, Model<TrashDocument>>({
    binId: {
        type: Types.ObjectId,
        ref: 'Bin',
        required: true
    },
    organic: { type: Number, default: 0 },//currency: percent
    inorganic: { type: Number, default: 0 },//currency: percent
    recyclable: { type: Number, default: 0 },//currency: percent
    //total: { type: Number },//currency: percent
},
    { timestamps: true });

export const TrashModel = model('Trash', trashSchema);