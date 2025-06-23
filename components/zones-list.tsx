"use client"
import { Button } from "@/components/ui/button"
import { useCattle } from "@/lib/cattle-context"
import { Plus } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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


interface ZonesListProps {
  onItemClick?: () => void
}

export default function ZonesList({ onItemClick }: ZonesListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { zones, cattle, selectedZoneId, setSelectedZoneId } = useCattle()
  const [newZone, setNewZone] = useState({
    name: "",
    description: "",
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
  });

  // Contar vacas por zona
  const cattleCountByZone = zones.reduce(
    (acc, zone) => {
      acc[zone.id] = cattle.filter((cow) => cow.zoneId === zone.id).length
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="space-y-1">
      {zones.map((zone) => (
        <button
          key={zone.id}
          className={`w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md transition-colors ${
            selectedZoneId === zone.id ? "bg-green-100 text-green-900" : "text-gray-700 hover:bg-gray-100"
          }`}
          onClick={() => {
            setSelectedZoneId(zone.id === selectedZoneId ? null : zone.id)
            onItemClick?.()
          }}
        >
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: zone.color }} />
            <span className="truncate">{zone.name}</span>
          </div>
          <span className="text-xs font-medium bg-gray-100 rounded-full px-2 py-0.5">
            {cattleCountByZone[zone.id] || 0}
          </span>
        </button>
      ))}
      <Button onClick={() => setIsAddDialogOpen(true)} size="sm" variant="default" className="w-full">
        <Plus className="h-4 w-4 mr-1" />
        Agregar
      </Button>
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar nueva zona</DialogTitle>
            <DialogDescription>
              Completa el formulario para agregar una nueva zona al sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                onChange={(e) => setNewZone({ ...newZone, description: e.target.value })}

              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="description">Primer limite X Y </Label>
              <Input 
                type="number" 
                step="any"
                id="x1"
                placeholder="Coordenadas en x 1"
                onChange={(e) => setNewZone({ ...newZone, x1: parseFloat(e.target.value) })}
              />
              <Input 
                type="number"
                step="any" 
                id="y1"
                placeholder="Coordenadas en y 1"
                onChange={(e) => setNewZone({ ...newZone, y1: parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="description">Segundo limite X Y </Label>
              <Input 
                type="number"
                step="any" 
                id="x2"
                placeholder="Coordenadas en x 2"
                onChange={(e) => setNewZone({ ...newZone, x2: parseFloat(e.target.value) })}
              />
              <Input 
                type="number"
                step="any" 
                id="y2"
                placeholder="Coordenadas en y 2"
                onChange={(e) => setNewZone({ ...newZone, y2: parseFloat(e.target.value) })}
              />
            </div>
          </div>
                
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="outline">
                Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

