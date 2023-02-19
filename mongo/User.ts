import { Model, model, Document, Schema } from 'mongoose';
import User from '../models/User';

interface UserDocument extends User, Document {
    _id: any;
    _doc?: any;
}

const userSchema = new Schema<UserDocument, Model<UserDocument>>({
    name: { type: String },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    deviceId: { type: String },
},
    { timestamps: true });

export const UserModel = model('User', userSchema);