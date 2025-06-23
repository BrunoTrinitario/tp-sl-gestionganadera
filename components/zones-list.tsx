"use client"
import { Button } from "@/components/ui/button"
import { useCattle } from "@/lib/cattle-context"
import { Plus, Trash } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
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

  async function addNewZone(){
    if (newZone.name == "" || newZone.x1 == 0 || newZone.y1 == 0 || newZone.x2 == 0 || newZone.y2 ==  0){
      alert("Datos invalidos");
    } else{
      const response = await fetch('/api/zones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newZone.name,
          description: newZone.description,
          bounds: [[newZone.x1,newZone.y1],[newZone.x2,newZone.y2]],  
          color:generateHexColor()
        }),
      }).then(response => {
          if (response.ok) {
            window.location.reload();
          } else {
            throw new Error(`Error HTTP: ${response.status}`);
          }
        })
    
      setNewZone({
        name: "",
        description: "",
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
      });
    }
  }

  function generateHexColor() {
    const hex = Math.floor(Math.random() * 0xffffff).toString(16);
    return "#" + hex.padStart(6, "0");
  }
  async function deleteZone(id: string) {
    console.log(id);
    const response = await fetch(`/api/zones?id=${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) 
      throw new Error("Error al eliminar la zona");
    else
      window.location.reload();
  } 

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
          <Button
              size="sm"
              variant="outline"
              className="w-10 h-10 text-red-500 border-red-200 hover:bg-red-50 flex justify-center items-center p-0"
              onClick={(e) => {
                e.stopPropagation(); // Para que no dispare el onClick del botón padre <button>
                deleteZone(zone.id);
              }}
            >
              <Trash className="h-5 w-5" />
          </Button>
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
            <Button variant="outline" onClick={addNewZone}>
                Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

