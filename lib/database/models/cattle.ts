import mongoose, { Schema, Document, Types } from "mongoose"

export interface ICattle extends Document {
    _id: Types.ObjectId
    name: string
    description: string
    imageUrl: string
    position: {
        type: "Point"
        coordinates: [number, number] // [longitude, latitude]
    }
    connected: boolean
    zoneId: Types.ObjectId | null
}

const CattleSchema: Schema = new Schema({
    _id: { type: Schema.Types.ObjectId, default: () => new Types.ObjectId() },
    name: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    position: {
        type: {
            type: String,
            enum: ["Point"],
            required: true,
            default: "Point",
        },
        coordinates: {
            type: [Number],
            required: true,
            validate: (arr: number[]) => arr.length === 2,
        },
  },
  connected: { type: Boolean, required: true },
  zoneId: { type: Schema.Types.ObjectId, ref: "Zone", default: null },
})

// Crear índice geoespacial
CattleSchema.index({ position: "2dsphere" })

export default mongoose.models.Cattle || mongoose.model<ICattle>("Cattle", CattleSchema)