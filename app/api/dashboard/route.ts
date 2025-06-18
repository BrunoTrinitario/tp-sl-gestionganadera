import { NextResponse } from "next/server"
import { connectDB } from "@/lib/database/connect"
import Cattle from "@/lib/database/models/cattle"
import Zone from "@/lib/database/models/zone"

/**
 * GET /api/dashboard
 * Obtiene los datos para el dashboard desde la base de datos
 */
export async function GET() {
  try {
    await connectDB()
    
    // Obtener estadísticas reales de la base de datos
    const totalCattle = await Cattle.countDocuments()
    const connectedCattle = await Cattle.countDocuments({ connected: true })
    const totalZones = await Zone.countDocuments()
    
    // Por ahora, asumimos que no hay una colección específica de alertas
    // Si existiera, se podría reemplazar con: const alerts = await Alert.countDocuments()
    const alerts = 0
    
    const dashboardData = {
      totalCattle,
      connectedCattle,
      totalZones,
      alerts,
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json(
      {
        success: true,
        data: dashboardData,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error al obtener datos del dashboard:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener datos del dashboard",
      },
      { status: 500 },
    )
  }
}
