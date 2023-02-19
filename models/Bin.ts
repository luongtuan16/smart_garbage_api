export default class Bin {
    _id: string;
    name: string;
    address: string;
    image?: string;
    lat: number;
    long: number;
    organics?: number[];
    inorganics?: number[];
    recyclables?: number[];
    total?: number[];
    constructor(args: any) {
        console.log(args.organics)
        this._id = args._id ?? undefined;
        this.name = args.name ?? '';
        this.address = args.address ?? '';
        this.image = args.image ?? '';
        this.lat = args.lat ?? undefined;
        this.long = args.long ?? '';
        this.organics = args.organics?.map(i => Number(i)) ?? [];
        this.inorganics = args.inorganics?.map(i => Number(i)) ?? [];
        this.recyclables = args.recyclables?.map(i => Number(i)) ?? [];
        this.total = args.total?.map(i => Number(i)) ?? [];
    }
}