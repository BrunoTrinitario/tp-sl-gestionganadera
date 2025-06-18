import { NextResponse } from "next/server"
import { connectDB } from "@/lib/database/connect"
import Zone from "@/lib/database/models/zone"

/**
 * GET /api/zones
 * Obtiene la lista de zonas
 */
export async function GET() {
  try {
    await connectDB()
    const zones = await Zone.find().lean()

    // Serializar _id a id string
    const serializedZones = zones.map((zone: any) => ({
      id: zone._id.toString(),
      name: zone.name,
      description: zone.description,
      bounds: zone.bounds,
      color: zone.color,
    }))

    return NextResponse.json(
      serializedZones,
      { status: 200 }
    )
  } catch (error) {
    console.error("Error al obtener zonas:", error)
    return NextResponse.json(
      { error: "Error al obtener zonas" },
      { status: 500 }
    )
  }
}