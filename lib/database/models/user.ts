import mongoose, { Schema, Document } from "mongoose"

export interface IUser extends Document {
    _id: string
    name: string
    email: string
    role: string
    password: string
}

const UserSchema: Schema = new Schema({
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true }, // Ejemplo: "admin", "operador", etc.
    password: { type: String, required: true },
})

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema)