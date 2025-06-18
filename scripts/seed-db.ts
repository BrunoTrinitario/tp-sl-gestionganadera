import { connectDB } from "../lib/database/connect"
import User from "../lib/database/models/user"
import Zone from "../lib/database/models/zone"
import Cattle from "../lib/database/models/cattle"

// Usuarios de ejemplo
const mockUsers = [
  {
    name: "Administrador",
    email: "admin@ejemplo.com",
    role: "admin",
    password: "password",
  },
  {
    name: "Juan Pérez",
    email: "juan@ejemplo.com",
    role: "operador",
    password: "password",
  },
  {
    name: "María López",
    email: "maria@ejemplo.com",
    role: "veterinario",
    password: "password",
  },
]

// Zonas hardcodeadas (sin id)
const zonesData = [
  {
    name: "Granja Completa",
    description: "Perímetro completo de la granja",
    bounds: [
      [40.7028, -74.016], // [lat, lng]
      [40.7228, -73.996],
    ],
    color: "#3b82f6",
  },
  {
    name: "Establos",
    description: "Área de descanso para el ganado",
    bounds: [
      [40.7048, -74.014],
      [40.7088, -74.010],
    ],
    color: "#ef4444",
  },
  {
    name: "Comederos",
    description: "Área de alimentación",
    bounds: [
      [40.7048, -74.002],
      [40.7088, -73.998],
    ],
    color: "#f97316",
  },
  {
    name: "Bebederos",
    description: "Área de hidratación",
    bounds: [
      [40.7168, -74.014],
      [40.7208, -74.010],
    ],
    color: "#22c55e",
  },
  {
    name: "Áreas de Ordeño",
    description: "Zona de producción de leche",
    bounds: [
      [40.7168, -74.002],
      [40.7208, -73.998],
    ],
    color: "#a855f7",
  },
  {
    name: "Maternidades",
    description: "Área para vacas preñadas y recién paridas",
    bounds: [
      [40.7108, -74.004],
      [40.7148, -74.002],
    ],
    color: "#ec4899",
  },
  {
    name: "Áreas de Pastoreo",
    description: "Zonas de alimentación natural",
    bounds: [
      [40.7068, -74.005],
      [40.7118, -73.999],
    ],
    color: "#84cc16",
  },
]

// Vacas hardcodeadas (sin id, zoneId se asigna luego)
const cattleData = [
  {
    name: "Bella",
    description: "Holstein de 5 años, alta productora de leche",
    imageUrl: "/placeholder.svg?height=200&width=200",
    position: { type: "Point", coordinates: [-74.012, 40.706] },
    connected: true,
    zoneName: "Establos",
  },
  {
    name: "Luna",
    description: "Jersey de 3 años, excelente calidad de leche",
    imageUrl: "/placeholder.svg?height=200&width=200",
    position: { type: "Point", coordinates: [-74.013, 40.707] },
    connected: true,
    zoneName: "Establos",
  },
  {
    name: "Estrella",
    description: "Angus de 4 años, buena para carne",
    imageUrl: "/placeholder.svg?height=200&width=200",
    position: { type: "Point", coordinates: [-74.001, 40.705] },
    connected: true,
    zoneName: "Comederos",
  },
  {
    name: "Manchas",
    description: "Hereford de 6 años, madre de 4 terneros",
    imageUrl: "/placeholder.svg?height=200&width=200",
    position: { type: "Point", coordinates: [-74.003, 40.707] },
    connected: false,
    zoneName: "Comederos",
  },
  {
    name: "Flor",
    description: "Brahman de 2 años, resistente al calor",
    imageUrl: "/placeholder.svg?height=200&width=200",
    position: { type: "Point", coordinates: [-74.013, 40.718] },
    connected: true,
    zoneName: "Bebederos",
  },
  {
    name: "Dulce",
    description: "Charolais de 7 años, gran tamaño",
    imageUrl: "/placeholder.svg?height=200&width=200",
    position: { type: "Point", coordinates: [-74.002, 40.719] },
    connected: true,
    zoneName: "Áreas de Ordeño",
  },
  {
    name: "Canela",
    description: "Limousin de 3 años, buena musculatura",
    imageUrl: "/placeholder.svg?height=200&width=200",
    position: { type: "Point", coordinates: [-74.003, 40.712] },
    connected: false,
    zoneName: "Maternidades",
  },
  {
    name: "Lucero",
    description: "Simmental de 4 años, doble propósito",
    imageUrl: "/placeholder.svg?height=200&width=200",
    position: { type: "Point", coordinates: [-74.004, 40.710] },
    connected: true,
    zoneName: "Maternidades",
  },
  {
    name: "Princesa",
    description: "Gyr de 5 años, adaptable a climas cálidos",
    imageUrl: "/placeholder.svg?height=200&width=200",
    position: { type: "Point", coordinates: [-74.004, 40.708] },
    connected: true,
    zoneName: "Áreas de Pastoreo",
  },
  {
    name: "Margarita",
    description: "Normando de 6 años, buena para leche y carne",
    imageUrl: "/placeholder.svg?height=200&width=200",
    position: { type: "Point", coordinates: [-74.002, 40.710] },
    connected: true,
    zoneName: "Áreas de Pastoreo",
  },
  {
    name: "Violeta",
    description: "Holstein de 5 años, alta productora de leche",
    imageUrl: "/placeholder.svg?height=200&width=200",
    position: { type: "Point", coordinates: [-74.010, 40.708] },
    connected: true,
    zoneName: "Establos",
  },
  {
    name: "Rosa",
    description: "Jersey de 3 años, excelente calidad de leche",
    imageUrl: "/placeholder.svg?height=200&width=200",
    position: { type: "Point", coordinates: [-74.011, 40.709] },
    connected: true,
    zoneName: "Establos",
  },
  {
    name: "Azucena",
    description: "Angus de 4 años, buena para carne",
    imageUrl: "/placeholder.svg?height=200&width=200",
    position: { type: "Point", coordinates: [-74.005, 40.705] },
    connected: true,
    zoneName: "Comederos",
  },
  {
    name: "Perla",
    description: "Hereford de 6 años, madre de 4 terneros",
    imageUrl: "/placeholder.svg?height=200&width=200",
    position: { type: "Point", coordinates: [-74.006, 40.707] },
    connected: false,
    zoneName: "Comederos",
  },
  {
    name: "Diamante",
    description: "Brahman de 2 años, resistente al calor",
    imageUrl: "/placeholder.svg?height=200&width=200",
    position: { type: "Point", coordinates: [-74.013, 40.715] },
    connected: true,
    zoneName: "Bebederos",
  },
  {
    name: "Esmeralda",
    description: "Charolais de 7 años, gran tamaño",
    imageUrl: "/placeholder.svg?height=200&width=200",
    position: { type: "Point", coordinates: [-74.002, 40.717] },
    connected: true,
    zoneName: "Áreas de Ordeño",
  },
  {
    name: "Rubí",
    description: "Limousin de 3 años, buena musculatura",
    imageUrl: "/placeholder.svg?height=200&width=200",
    position: { type: "Point", coordinates: [-74.003, 40.713] },
    connected: false,
    zoneName: "Maternidades",
  },
  {
    name: "Zafiro",
    description: "Simmental de 4 años, doble propósito",
    imageUrl: "/placeholder.svg?height=200&width=200",
    position: { type: "Point", coordinates: [-74.004, 40.711] },
    connected: true,
    zoneName: "Maternidades",
  },
  {
    name: "Ámbar",
    description: "Gyr de 5 años, adaptable a climas cálidos",
    imageUrl: "/placeholder.svg?height=200&width=200",
    position: { type: "Point", coordinates: [-74.004, 40.709] },
    connected: true,
    zoneName: "Áreas de Pastoreo",
  },
  {
    name: "Topacio",
    description: "Normando de 6 años, buena para leche y carne",
    imageUrl: "/placeholder.svg?height=200&width=200",
    position: { type: "Point", coordinates: [-74.002, 40.711] },
    connected: true,
    zoneName: "Áreas de Pastoreo",
  },
]

async function seed() {
  await connectDB()

  // Limpia las colecciones antes de insertar
  await User.deleteMany({})
  await Zone.deleteMany({})
  await Cattle.deleteMany({})

  // Inserta usuarios
  await User.insertMany(mockUsers)

  // Inserta zonas y obtiene los documentos con _id
  const savedZones = await Zone.insertMany(zonesData)

  // Relaciona las vacas con las zonas insertadas usando el nombre
  const cattleToInsert = cattleData.map((cow) => {
    const zone = savedZones.find((z) => z.name === cow.zoneName)
    return {
      name: cow.name,
      description: cow.description,
      imageUrl: cow.imageUrl,
      position: cow.position,
      connected: cow.connected,
      zoneId: zone ? zone._id : null,
    }
  })

  await Cattle.insertMany(cattleToInsert)

  console.log("Base de datos poblada con datos hardcodeados.")
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})