
export default class Trash {
    _id: string;
    binId: any;
    organic: number;//percent
    inorganic: number;//percent
    recyclable: number;//percent
    createdAt: Date;
    updatedAt: Date;
    constructor(args: any) {
        this._id = args._id ?? undefined;
        this.binId = args.binId ?? '';
        this.organic = args.organic ?? 0;
        this.inorganic = args.inorganic ?? 0;
        this.recyclable = args.recyclable ?? 0;
    }
}