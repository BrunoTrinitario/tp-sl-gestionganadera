import mongoose, { Schema, Document } from "mongoose"

export interface IZone extends Document {
    _id: string
    name: string
    description: string
    bounds: [[number, number], [number, number]]
    color: string
}

const ZoneSchema: Schema = new Schema({
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    name: { type: String, required: true },
    description: { type: String, required: true },
    bounds: {
        type: [[Number]],
        required: true,
        validate: (arr: number[][]) => arr.length === 2 && arr[0].length === 2 && arr[1].length === 2,
    },
    color: { type: String, required: true },
})

export default mongoose.models.Zone || mongoose.model<IZone>("Zone", ZoneSchema)