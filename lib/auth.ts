"use server"

import { cookies } from "next/headers"
import { connectDB } from "@/lib/database/connect"
import User from "@/lib/database/models/user"

export async function login(email: string, password: string) {
  try {
    // Conectar a la base de datos
    await connectDB()
    
    // Buscar el usuario por email
    const user = await User.findOne({ email }).lean() as { _id: any, email: string, name: string, role: string, password: string } | null
    
    // Verificar si el usuario existe y la contraseña es correcta
    if (!user || user.password !== password) {
      throw new Error("Credenciales inválidas")
    }
    
    // Crear una sesión 
    const session = {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
    } as any

    // Guardar en cookies
    (await cookies()).set("session", JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 día
      path: "/",
    })

    return session
  } catch (error) {
    console.error("Error en login:", error)
    throw new Error("Credenciales inválidas")
  }
}

export async function logout() {
  (await cookies()).delete("session")
}

export async function getSession() {
  const sessionCookie = (await cookies()).get("session")

  if (!sessionCookie) {
    return null
  }

  try {
    const session = JSON.parse(sessionCookie.value)

    // Verificar si la sesión ha expirado
    if (new Date(session.expires) < new Date()) {
      (await cookies()).delete("session")
      return null
    }

    return session
  } catch (error) {
    return null
  }
}
