export default class Manage {
    _id: string;
    userId: string | null;
    binId: string | null;
    constructor(args: any) {
        this._id = args._id ?? undefined;
        this.userId = args.userId ?? '';
        this.binId = args.binId ?? '';
    }
}