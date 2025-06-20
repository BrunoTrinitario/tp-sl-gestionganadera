import mongoose from "mongoose"
import "dotenv/config"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/gestionganadera"

async function clearDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as any)

    const db = mongoose.connection.db
    if (!db) {
      throw new Error("No se pudo obtener la conexión a la base de datos.")
    }
    const collections = await db.listCollections().toArray()

    for (const collection of collections) {
      console.log(`Eliminando colección: ${collection.name}`)
      await db.dropCollection(collection.name)
    }

    console.log("Base de datos borrada exitosamente.")
    await mongoose.disconnect()
  } catch (error) {
    console.error("Error al borrar la base de datos:", error)
    process.exit(1)
  }
}

clearDatabase()