"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, MoreHorizontal, Search, Trash, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import Fuse from 'fuse.js'

// Tipo para el usuario
type User = {
  id: string
  name: string
  email: string
  role: string
}

// Tipo para la paginación
type Pagination = {
  total: number
  page: number
  limit: number
  pages: number
}

export default function UsersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
  })
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([]) // Para búsqueda local
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isFuseActive, setIsFuseActive] = useState(false)

  // Configuración de Fuse.js
  const fuseOptions = {
    keys: ['name', 'email', 'role'],
    threshold: 0.3,
    includeScore: true,
    ignoreLocation: true
  }
  
  // Crear el índice Fuse
  const fuse = useMemo(() => new Fuse(allUsers, fuseOptions), [allUsers])
  
  // Debounce search term para la API
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        // Si hay término de búsqueda, usamos Fuse para búsqueda local
        setIsFuseActive(true)
        const results = fuse.search(searchTerm)
        setFilteredUsers(results.map(result => result.item))
      } else {
        setIsFuseActive(false)
        setDebouncedSearchTerm("")
        setFilteredUsers(users)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, fuse, users])

  // Fetch users when page, limit or search changes
  useEffect(() => {
    if (!isFuseActive) {
      fetchUsers()
    }
  }, [pagination.page, pagination.limit, debouncedSearchTerm, isFuseActive])
  
  // Cargar todos los usuarios para búsqueda local
  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        const response = await fetch(`/api/users?limit=100`) // Cargar más usuarios para búsqueda local
        const data = await response.json()
        if (data.success) {
          setAllUsers(data.data)
        }
      } catch (error) {
        console.error("Error fetching all users:", error)
      }
    }
    
    loadAllUsers()
  }, [])

  // Function to fetch users from API
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (debouncedSearchTerm) {
        params.append("search", debouncedSearchTerm)
      }

      const response = await fetch(`/api/users?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setUsers(data.data)
        setFilteredUsers(data.data) // Inicialmente los mismos
        setPagination(data.pagination)
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al cargar usuarios",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al obtener usuarios",
        variant: "destructive",
      })
      console.error("Error fetching users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Function to create a new user
  const handleCreateUser = async () => {
    // Validar campos
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      })
      return
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newUser.email)) {
      toast({
        title: "Error",
        description: "El formato del email no es válido",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      })

      const data = await response.json()

      if (data.success) {
        // Limpiar formulario y cerrar diálogo
        setNewUser({
          name: "",
          email: "",
          password: "",
        })
        setIsCreateDialogOpen(false)

        // Refrescar lista de usuarios
        fetchUsers()

        toast({
          title: "Usuario creado",
          description: `Se ha creado el usuario ${newUser.name} correctamente`,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al crear usuario",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al crear usuario",
        variant: "destructive",
      })
      console.error("Error creating user:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Function to delete a user
  const handleDeleteUser = async (email: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/users?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Usuario eliminado",
          description: "El usuario ha sido eliminado correctamente",
        })
        // Refrescar lista de usuarios
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al eliminar usuario",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar usuario",
        variant: "destructive",
      })
      console.error("Error deleting user:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      setPagination({
        ...pagination,
        page: newPage,
      })
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white border-b h-16 flex items-center px-4 justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Volver</span>
          </Button>
          <h1 className="text-lg font-bold text-green-800 ml-2">Gestión de Usuarios</h1>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Usuarios</CardTitle>
                <CardDescription>Gestiona los usuarios del sistema</CardDescription>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={isLoading}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Nuevo Usuario
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear nuevo usuario</DialogTitle>
                    <DialogDescription>Completa los datos para crear un nuevo usuario en el sistema.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre</Label>
                      <Input
                        id="name"
                        placeholder="Nombre completo"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isLoading}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateUser} disabled={isLoading}>
                      {isLoading ? "Creando..." : "Crear Usuario"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar usuarios... (nombre, email, rol)"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                        Cargando usuarios...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Acciones</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 cursor-pointer"
                                onClick={() => handleDeleteUser(user.email)}
                                disabled={isLoading}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {!isFuseActive && (
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando <span className="font-medium">{users.length}</span> de{" "}
                  <span className="font-medium">{pagination.total}</span> usuarios
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1 || isLoading}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.pages || isLoading}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
