export default class User {
    _id: string;
    name?: string;
    username: string;
    password: string;
    isAdmin: boolean;
    deviceId?: string;
    constructor(args: any) {
        this._id = args._id ?? undefined;
        this.name = args.name ?? '';
        this.username = args.username ?? '';
        this.password = args.password ?? '';
        this.isAdmin = args.isAdmin ?? false;
        this.deviceId = args.deviceId ?? '';
    }
}