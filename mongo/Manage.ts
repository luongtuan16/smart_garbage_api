import { Document, model, Model, Schema, Types } from 'mongoose';
import Manage from '../models/Manage';

interface ManageDocument extends Manage, Document {
    _id: any;
    _doc?: any;
}

const manageSchema = new Schema<ManageDocument, Model<ManageDocument>>({
    userId: {
        type: Types.ObjectId,
        ref: 'User',
        required: true
    },
    binId: {
        type: Types.ObjectId,
        ref: 'Bin',
        required: true
    },
},
    { timestamps: true });

export const ManageModel = model('Manage', manageSchema);