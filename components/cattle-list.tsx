"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, MapPin, X, Plus, Trash } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useCattle } from "@/lib/cattle-context"
import Image from 'next/image'
import Fuse from 'fuse.js'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Función para calcular la distancia entre dos puntos (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distancia en km
}

export default function CattleList() {
  // Usa el hook al inicio del componente (nivel superior)
  const { cattle, zones, selectedCattleId, setSelectedCattleId, fetchCattle } = useCattle()
  const [searchTerm, setSearchTerm] = useState("")
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [radius, setRadius] = useState("")
  const [isLocationSearchActive, setIsLocationSearchActive] = useState(false)
  const [searchResults, setSearchResults] = useState(cattle)
  const { toast } = useToast()
  
  // Estado para el formulario de nuevo ganado
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newCattle, setNewCattle] = useState({
    name: "",
    description: "",
    zoneId: "",
    imageUrl: "/placeholder.svg?height=200&width=200", // Imagen por defecto
  })
  
  // Estado para el diálogo de eliminar
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCattleToDelete, setSelectedCattleToDelete] = useState("")
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Configuración de Fuse.js
  const fuseOptions = {
    keys: ['name', 'description'],
    threshold: 0.3, // Umbral de coincidencia (0.0 = coincidencia perfecta, 1.0 = coincidencia muy difusa)
    includeScore: true, // Incluir puntuación de coincidencia
    ignoreLocation: true, // No considerar la ubicación de la coincidencia
    findAllMatches: true,
  }
  
  // Crear el índice Fuse cuando cambia la lista de ganado
  const fuse = useMemo(() => {
    // Enriquecer los datos con información de zona para la búsqueda
    const enrichedCattle = cattle.map(cow => ({
      ...cow, 
      zoneName: cow.zoneId ? zones.find(z => z.id === cow.zoneId)?.name || "" : ""
    }))
    return new Fuse(enrichedCattle, fuseOptions)
  }, [cattle, zones])
  
  // Realizar búsqueda cuando cambia el término de búsqueda
  useEffect(() => {
    if (!searchTerm) {
      setSearchResults(cattle)
      return
    }
    
    const results = fuse.search(searchTerm)
    // Extraer los objetos de los resultados de búsqueda
    const matchedCattle = results.map(result => result.item)
    setSearchResults(matchedCattle)
  }, [searchTerm, cattle, fuse])
  
  // Filtrar por ubicación si la búsqueda avanzada está activa
  let filteredCattle = searchResults
  
  if (isLocationSearchActive && latitude && longitude && radius) {
    const lat = Number.parseFloat(latitude)
    const lng = Number.parseFloat(longitude)
    const rad = Number.parseFloat(radius)

    if (!isNaN(lat) && !isNaN(lng) && !isNaN(rad)) {
      filteredCattle = filteredCattle.filter((cow) => {
        const distance = calculateDistance(lat, lng, cow.position[0], cow.position[1])
        return distance <= rad
      })
    }
  }

  const handleAdvancedSearch = () => {
    if (latitude && longitude && radius) {
      setIsLocationSearchActive(true)
    }
  }

  const clearAdvancedSearch = () => {
    setLatitude("")
    setLongitude("")
    setRadius("")
    setIsLocationSearchActive(false)
  }

  // Función para manejar el envío del formulario
  const handleAddCattle = async () => {
    // Validar campos obligatorios
    if (!newCattle.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre es obligatorio",
        variant: "destructive",
      })
      return
    }

    if (!newCattle.description.trim()) {
      toast({
        title: "Error",
        description: "La descripción es obligatoria",
        variant: "destructive",
      })
      return
    }

    // Usar coordenadas aproximadas del centro de la zona si está seleccionada
    // o del centro de la granja si no hay zona seleccionada
    let position: [number, number] = [40.7128, -74.006] // Coordenadas por defecto
    
    // Si se seleccionó una zona, usar las coordenadas centrales de esa zona
    if (newCattle.zoneId) {
      const selectedZone = zones.find(zone => zone.id === newCattle.zoneId)
      if (selectedZone) {
        const [[lat1, lng1], [lat2, lng2]] = selectedZone.bounds
        position = [(lat1 + lat2) / 2, (lng1 + lng2) / 2] // Punto central de la zona
      }
    } else {
      // Si no hay zona seleccionada, usar el centro de la primera zona (la granja)
      if (zones.length > 0) {
        const farmZone = zones[0]
        const [[lat1, lng1], [lat2, lng2]] = farmZone.bounds
        position = [(lat1 + lat2) / 2, (lng1 + lng2) / 2]
      }
    }

    try {
      setIsSubmitting(true)
      
      const response = await fetch('/api/cattle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCattle.name,
          description: newCattle.description,
          zoneId: newCattle.zoneId || null,
          imageUrl: newCattle.imageUrl,
          position: position,
          connected: true, // Por defecto conectado
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "¡Éxito!",
          description: `${newCattle.name} ha sido añadido correctamente`,
        })

        // Cerrar diálogo y reiniciar formulario
        setIsAddDialogOpen(false)
        setNewCattle({
          name: "",
          description: "",
          zoneId: "",
          imageUrl: "/placeholder.svg?height=200&width=200",
        })

        // Usar la referencia a fetchCattle que obtuvimos en el nivel superior
        fetchCattle()
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al crear el animal",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al añadir ganado:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar el ganado. Intenta de nuevo más tarde.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Manejar selección de animal para eliminar
  const handleSelectCattleToDelete = (cattleId: string) => {
    setSelectedCattleToDelete(cattleId)
  }

  // Iniciar proceso de confirmación de eliminación
  const handleConfirmDelete = () => {
    if (!selectedCattleToDelete) {
      toast({
        title: "Error",
        description: "No se ha seleccionado ningún animal para eliminar",
        variant: "destructive",
      })
      return
    }
    
    setIsDeleteDialogOpen(false)
    setIsConfirmDeleteOpen(true)
  }

  // Ejecutar la eliminación
  const handleDeleteCattle = async () => {
    if (!selectedCattleToDelete) return
    
    try {
      setIsDeleting(true)
      
      const response = await fetch(`/api/cattle?id=${selectedCattleToDelete}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Animal eliminado",
          description: "El animal ha sido eliminado correctamente",
        })
        
        // Si el animal eliminado estaba seleccionado, desseleccionarlo
        if (selectedCattleId === selectedCattleToDelete) {
          setSelectedCattleId(null)
        }
        
        // Actualizar la lista
        fetchCattle()
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al eliminar el animal",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al eliminar ganado:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el animal. Intenta de nuevo más tarde.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsConfirmDeleteOpen(false)
      setSelectedCattleToDelete("")
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda en una fila completa */}
      <div className="w-full relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="search"
          placeholder="Buscar ganado..."
          className="pl-8 pr-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1 h-7 w-7 px-0"
          onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
        >
          <MapPin className="h-4 w-4" />
          <span className="sr-only">Búsqueda avanzada</span>
        </Button>
      </div>
      
      {/* Botones en una segunda fila - modificado para ocupar el ancho completo */}
      <div className="w-full grid grid-cols-2 gap-2">
        {/* Botón para agregar */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="default" className="w-full">
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar nuevo animal</DialogTitle>
              <DialogDescription>
                Completa el formulario para agregar un nuevo animal al sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="Nombre del animal"
                  value={newCattle.name}
                  onChange={(e) => setNewCattle({ ...newCattle, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  placeholder="Descripción o características"
                  value={newCattle.description}
                  onChange={(e) => setNewCattle({ ...newCattle, description: e.target.value })}
                  className="resize-none"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zone">Zona</Label>
                <Select 
                  value={newCattle.zoneId || "none"} 
                  onValueChange={(value) => setNewCattle({ 
                    ...newCattle, 
                    zoneId: value === "none" ? "" : value 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una zona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin zona</SelectItem>
                    {zones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button onClick={handleAddCattle} disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar animal"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Botón para eliminar */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="w-full text-red-500 border-red-200 hover:bg-red-50">
              <Trash className="h-4 w-4 mr-1" />
              Eliminar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar animal</DialogTitle>
              <DialogDescription>
                Selecciona el animal que deseas eliminar del sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="animal-to-delete" className="mb-2 block">Selecciona un animal</Label>
              <Select 
                value={selectedCattleToDelete} 
                onValueChange={handleSelectCattleToDelete}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un animal" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCattle.map((cow) => (
                    <SelectItem key={cow.id} value={cow.id}>
                      {cow.name} {!cow.connected && "(Offline)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmDelete} 
                disabled={!selectedCattleToDelete}
              >
                Continuar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Diálogo de confirmación para eliminación */}
      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente {cattle.find(c => c.id === selectedCattleToDelete)?.name || "el animal seleccionado"} 
              y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCattle}
              disabled={isDeleting} 
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Búsqueda avanzada */}
      {showAdvancedSearch && (
        <div className="rounded-md border p-3 bg-gray-50">
          <div className="text-sm font-medium mb-2 flex justify-between items-center">
            <span>Búsqueda por coordenadas</span>
            {isLocationSearchActive && (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Filtro activo
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <Label htmlFor="latitude" className="text-xs">
                Latitud
              </Label>
              <Input
                id="latitude"
                type="number"
                placeholder="Ej: 40.7128"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="longitude" className="text-xs">
                Longitud
              </Label>
              <Input
                id="longitude"
                type="number"
                placeholder="Ej: -74.0060"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="mb-3">
            <Label htmlFor="radius" className="text-xs">
              Radio (km)
            </Label>
            <Input
              id="radius"
              type="number"
              placeholder="Ej: 5"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="w-full"
              onClick={handleAdvancedSearch}
              disabled={!latitude || !longitude || !radius}
            >
              Buscar
            </Button>
            <Button size="sm" variant="outline" className="w-full" onClick={clearAdvancedSearch}>
              Limpiar
            </Button>
          </div>
        </div>
      )}

      {isLocationSearchActive && (
        <div className="flex items-center justify-between bg-green-50 p-2 rounded-md">
          <span className="text-xs text-green-700">Mostrando ganado in un radio de {radius} km</span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={clearAdvancedSearch}>
            <X className="h-4 w-4" />
            <span className="sr-only">Limpiar filtro</span>
          </Button>
        </div>
      )}

      <Separator />

      <div className="space-y-1">
        {filteredCattle.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No se encontraron resultados</p>
        ) : (
          filteredCattle.map((cow) => (
            <div
              key={cow.id}
              className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
                selectedCattleId === cow.id ? "bg-green-50" : "hover:bg-gray-50"
              }`}
              onClick={() => setSelectedCattleId(cow.id)}
            >
              <div className="flex-shrink-0 mr-3">
                <div className="relative">
                  <Image
                    width={40}
                    height={40}
                    src={cow.imageUrl || "/placeholder.svg"}
                    alt={cow.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      cow.connected ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{cow.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {cow.zoneId ? (
                    <span>Zona: {zones.find((z) => z.id === cow.zoneId)?.name || "Desconocida"}</span>
                  ) : (
                    <span className="text-yellow-600">Sin zona</span>
                  )}
                </p>
              </div>
              {!cow.connected && (
                <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
                  Offline
                </Badge>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
