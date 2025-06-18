import { connectDB } from "../lib/database/connect"
import User from "../lib/database/models/user"
import Zone from "../lib/database/models/zone"
import Cattle from "../lib/database/models/cattle"

async function initDB() {
  await connectDB()

  // Opcional: Insertar un documento de ejemplo en cada colección para forzar su creación
  await User.create()

  await Zone.create()

  await Cattle.create()

  console.log("Base de datos inicializada con colecciones")
  process.exit(0)
}

initDB().catch((err) => {
  console.error(err)
  process.exit(1)
})