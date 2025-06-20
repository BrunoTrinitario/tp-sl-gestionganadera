import mongoose from "mongoose"
import "dotenv/config"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/gestionganadera"

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) return
  console.log("Conectando a:", MONGODB_URI)
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as any)
}