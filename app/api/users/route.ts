import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { connectDB } from "@/lib/database/connect"
import User from "@/lib/database/models/user"

/**
 * GET /api/users
 * Obtiene la lista de usuarios
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    // Obtener parámetros de búsqueda de la URL
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    // Construir el filtro de MongoDB
    const filter: any = {}

    // Filtrar por término de búsqueda si existe
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
      ]
    }

    // Calcular skip para paginación
    const skip = (page - 1) * limit

    // Contar total de documentos para paginación
    const total = await User.countDocuments(filter)

    // Obtener usuarios paginados
    const users = await User.find(filter)
      .select("-password") // Excluir contraseña
      .skip(skip)
      .limit(limit)
      .lean()

    // Serializar los datos para la respuesta
    const serializedUsers = users.map((user: any) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    }))

    return NextResponse.json(
      {
        success: true,
        data: serializedUsers,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener usuarios",
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/users
 * Crea un nuevo usuario
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    // Obtener datos del cuerpo de la solicitud
    const body = await request.json()
    const { name, email, password, role = "Operador" } = body

    // Validar campos requeridos
    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Todos los campos son obligatorios",
        },
        { status: 400 },
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "El formato del email no es válido",
        },
        { status: 400 },
      )
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Ya existe un usuario con ese correo electrónico",
        },
        { status: 400 },
      )
    }

    // Hash de la contraseña

    // Crear nuevo usuario
    const newUser = new User({
      name,
      email,
      password,
      role,
    })

    await newUser.save()

    // Respuesta sin incluir la contraseña
    const userResponse = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    }

    return NextResponse.json(
      {
        success: true,
        data: userResponse,
        message: "Usuario creado correctamente",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error al crear usuario:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al crear usuario",
      },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/users/:id
 * Elimina un usuario por su ID
 */
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()

    // Obtener el ID del usuario desde la URL
    const url = new URL(request.url)
    const parts = url.pathname.split("/")
    const userId = parts[parts.length - 1]

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "ID de usuario no proporcionado",
        },
        { status: 400 },
      )
    }

    // Eliminar el usuario
    const deletedUser = await User.findByIdAndDelete(userId)

    if (!deletedUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Usuario no encontrado",
        },
        { status: 404 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Usuario eliminado correctamente",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error al eliminar usuario:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al eliminar usuario",
      },
      { status: 500 },
    )
  }
}
