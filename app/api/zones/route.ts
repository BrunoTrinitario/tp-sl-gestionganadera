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

/**
 * POST /api/zones
 * Crea una nueva zona
 */
export async function POST(request: Request) {
  try {
    await connectDB()
    const body = await request.json()
    const { name, description, bounds, color } = body

    if (!name || !bounds || !color) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      )
    }

    const newZone = await Zone.create({ name, description, bounds, color })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newZone._id.toString(),
          name: newZone.name,
          description: newZone.description,
          bounds: newZone.bounds,
          color: newZone.color,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error al crear zona:", error)
    return NextResponse.json(
      { error: "Error al crear zona" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/zones?id=ZONE_ID
 * Elimina una zona por su ID
 */
export async function DELETE(request: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID de zona no proporcionado" },
        { status: 400 }
      )
    }

    const deleted = await Zone.findByIdAndDelete(id)
    if (!deleted) {
      return NextResponse.json(
        { error: "Zona no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: true, message: "Zona eliminada correctamente" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error al eliminar zona:", error)
    return NextResponse.json(
      { error: "Error al eliminar zona" },
      { status: 500 }
    )
  }
}