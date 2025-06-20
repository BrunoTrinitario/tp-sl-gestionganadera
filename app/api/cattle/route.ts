import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { connectDB } from "@/lib/database/connect"
import Cattle from "@/lib/database/models/cattle"

/**
 * GET /api/cattle
 * Obtiene la lista de ganado con opciones de filtrado
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    // Obtener parámetros de búsqueda de la URL
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const zoneId = searchParams.get("zoneId")
    const connected = searchParams.get("connected")
    const lat = searchParams.get("lat") ? Number.parseFloat(searchParams.get("lat") || "") : null
    const lng = searchParams.get("lng") ? Number.parseFloat(searchParams.get("lng") || "") : null
    const radius = searchParams.get("radius") ? Number.parseFloat(searchParams.get("radius") || "") : null

    // Ordenar por (default: distancia si hay búsqueda geoespacial)
    const sortBy = searchParams.get("sortBy") || (lat && lng ? "distance" : "name")

    // Construir el filtro de MongoDB
    const filter: any = {}
    const sort: any = {}

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ]
    }

    if (zoneId) {
      filter.zoneId = zoneId
    }

    if (connected !== null && connected !== undefined) {
      filter.connected = connected === "true"
    }

    // Filtro geoespacial
    if (lat !== null && lng !== null && radius !== null) {
      filter.position = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat], // [long, lat]
          },
          $maxDistance: radius * 1000, // metros
        },
      }
      // Con $near ya viene ordenado por distancia automáticamente
    } else {
      // Ordenar por nombre si no hay búsqueda geoespacial
      sort.name = 1
    }

    const cattle = await Cattle.find(filter).sort(sort).lean()

    // Calcular distancias para cada resultado si hay búsqueda geoespacial
    const serializedCattle = cattle.map((cow: any) => {
      const result = {
        id: cow._id.toString(),
        name: cow.name,
        description: cow.description,
        imageUrl: cow.imageUrl,
        position: cow.position,
        connected: cow.connected,
        zoneId: cow.zoneId ? cow.zoneId.toString() : null,
      }

      // Agregar distancia si se hizo búsqueda geoespacial
      if (lat && lng) {
        const [cowLng, cowLat] = cow.position.coordinates
        const R = 6371 // Radio de la Tierra en km
        const dLat = ((cowLat - lat) * Math.PI) / 180
        const dLon = ((cowLng - lng) * Math.PI) / 180
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat * Math.PI) / 180) * Math.cos((cowLat * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c

        return {
          ...result,
          distance: parseFloat(distance.toFixed(2)) // distancia en km con 2 decimales
        }
      }

      return result
    })

    return NextResponse.json(
      {
        success: true,
        data: serializedCattle,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error al obtener ganado:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener ganado",
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/cattle
 * Crea un nuevo animal
 */
export async function POST(request: Request) {
  try {
    await connectDB()
    const body = await request.json()
    const { name, description, imageUrl, position, connected, zoneId } = body

    if (!name || !position || !Array.isArray(position) || position.length !== 2) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios o posición inválida" },
        { status: 400 }
      )
    }

    const newCattle = await Cattle.create({
      name,
      description,
      imageUrl,
      position: {
        type: "Point",
        coordinates: [position[1], position[0]], // [lng, lat]
      },
      connected: connected ?? true,
      zoneId: zoneId ?? null,
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newCattle._id.toString(),
          name: newCattle.name,
          description: newCattle.description,
          imageUrl: newCattle.imageUrl,
          position: newCattle.position,
          connected: newCattle.connected,
          zoneId: newCattle.zoneId ? newCattle.zoneId.toString() : null,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error al crear ganado:", error)
    return NextResponse.json(
      { error: "Error al crear ganado" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/cattle?id=CATTLE_ID
 * Elimina un animal por su ID
 */
export async function DELETE(request: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID de ganado no proporcionado" },
        { status: 400 }
      )
    }

    const deleted = await Cattle.findByIdAndDelete(id)
    if (!deleted) {
      return NextResponse.json(
        { error: "Ganado no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: true, message: "Ganado eliminado correctamente" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error al eliminar ganado:", error)
    return NextResponse.json(
      { error: "Error al eliminar ganado" },
      { status: 500 }
    )
  }
}