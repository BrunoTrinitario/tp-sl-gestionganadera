"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

export interface Cattle {
  id: string
  name: string
  description: string
  imageUrl: string
  position: [number, number]
  connected: boolean
  zoneId: string | null
}

export interface Zone {
  id: string
  name: string
  description: string
  bounds: [[number, number], [number, number]] // [[lat1, lng1], [lat2, lng2]]
  color: string
}

interface CattleContextType {
  cattle: Cattle[]
  zones: Zone[]
  loading: boolean
  connectedCattle: number
  selectedCattleId: string | null
  setSelectedCattleId: (id: string | null) => void
  selectedZoneId: string | null
  setSelectedZoneId: (id: string | null) => void
}

const CattleContext = createContext<CattleContextType | undefined>(undefined)

export function CattleProvider({ children }: { children: ReactNode }) {
  const [cattle, setCattle] = useState<Cattle[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCattleId, setSelectedCattleId] = useState<string | null>(null)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [connectedCattleCount, setConnectedCattleCount] = useState(0)
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()

  // Inicializar datos solo si el usuario está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      // No inicializar datos si no hay usuario autenticado
      return
    }

    const loadData = async () => {
      setLoading(true)
      try {
        // Primero cargamos las zonas ya que podrían ser necesarias para mostrar el ganado
        await fetchZones()
        await fetchCattle()

        // Reproducir sonido de bienvenida
        const audio = new Audio("/moo.mp3")
        audio.play().catch((e) => console.log("Error reproduciendo audio:", e))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isAuthenticated])

  // Obtener zonas desde la API
  const fetchZones = async () => {
    try {
      const response = await fetch('/api/zones');
      if (!response.ok) throw new Error('Error fetching zones');
      const data = await response.json();
      setZones(data); // Los datos ya vienen serializados correctamente según la API
    } catch (error) {
      console.error("Error fetching zones:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las zonas",
        variant: "destructive",
      });
    }
  };

  // Obtener ganado desde la API
  const fetchCattle = async () => {
    try {
      const response = await fetch('/api/cattle');
      if (!response.ok) throw new Error('Error fetching cattle');
      const data = await response.json();
      
      if (data.success) {
        // Transformar la estructura de posición a tu formato actual si es necesario
        const formattedCattle = data.data.map((cow: any) => ({
          ...cow,
          position: cow.position.coordinates ? 
            [cow.position.coordinates[1], cow.position.coordinates[0]] : // [lat, lng]
            [0, 0] // Valor por defecto si no hay coordenadas
        }));
        setCattle(formattedCattle);
      } else {
        throw new Error(data.error || 'Failed to fetch cattle');
      }
    } catch (error) {
      console.error("Error fetching cattle:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el ganado",
        variant: "destructive",
      });
    }
  };

  // GET /api/dashboard
  // Para estadísticas como número total o conectados
  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) throw new Error('Error fetching dashboard stats');
      const data = await response.json();
      
      if (data.success) {
        // Actualizar estadísticas relevantes
        // En lugar de calcular el número de ganado conectado desde el array local
        setConnectedCattleCount(data.data.connectedCattle);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  // Llamar a la API para obtener estadísticas del tablero al cargar el componente
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardStats();
    }
  }, [isAuthenticated])

  // Simular movimiento de vacas solo si el usuario está autenticado
  useEffect(() => {
    if (loading || !isAuthenticated || zones.length === 0) return

    const movementInterval = setInterval(() => {
      setCattle((prevCattle) => {
        return prevCattle.map((cow) => {
          // Solo mover vacas conectadas
          if (!cow.connected) return cow

          // Obtener los límites de la granja (primera zona)
          const farmZone = zones[0]
          const [[minLat, minLng], [maxLat, maxLng]] = farmZone.bounds

          // Movimiento aleatorio pequeño
          const latChange = (Math.random() - 0.5) * 0.001
          const lngChange = (Math.random() - 0.5) * 0.001

          // Calcular nueva posición
          let newLat = cow.position[0] + latChange
          let newLng = cow.position[1] + lngChange

          // Verificar si la nueva posición estaría fuera de la granja
          const wouldBeOutside = newLat < minLat || newLat > maxLat || newLng < minLng || newLng > maxLng

          // Si estaría fuera, hay una pequeña probabilidad (0.5%) de permitirlo para simular escape
          // De lo contrario, ajustamos la posición para mantenerla dentro de los límites
          if (wouldBeOutside && Math.random() > 0.005) {
            // Ajustar la posición para mantenerla dentro de los límites
            newLat = Math.max(minLat, Math.min(maxLat, newLat))
            newLng = Math.max(minLng, Math.min(maxLng, newLng))
          }

          const newPosition: [number, number] = [newLat, newLng]

          // Determinar en qué zona está
          let newZoneId: string | null = null

          for (const zone of zones) {
            const [[zMinLat, zMinLng], [zMaxLat, zMaxLng]] = zone.bounds

            if (
              newPosition[0] >= zMinLat &&
              newPosition[0] <= zMaxLat &&
              newPosition[1] >= zMinLng &&
              newPosition[1] <= zMaxLng
            ) {
              newZoneId = zone.id
              break
            }
          }

          // Verificar si salió de la zona general (primera zona)
          const isOutside =
            newPosition[0] < minLat || newPosition[0] > maxLat || newPosition[1] < minLng || newPosition[1] > maxLng

          if (isOutside) {
            // Alerta: vaca fuera de la granja
            const audio = new Audio("/alert.mp3")
            audio.play().catch((e) => console.log("Error reproduciendo alerta:", e))

            // Usamos setTimeout para evitar actualizar el estado durante el renderizado
            setTimeout(() => {
              toast({
                title: "¡Alerta de seguridad!",
                description: `${cow.name} ha salido de los límites de la granja`,
                variant: "destructive",
              })
            }, 0)

            // Enviar notificación push si está permitido
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("¡Alerta de seguridad!", {
                body: `${cow.name} ha salido de los límites de la granja`,
                icon: "/cow-icon.png",
              })
            }
          }

          return {
            ...cow,
            position: newPosition,
            zoneId: newZoneId,
          }
        })
      })
    }, 2000)

    return () => clearInterval(movementInterval)
  }, [loading, zones, toast, isAuthenticated])

  // Simular desconexiones aleatorias solo si el usuario está autenticado
  useEffect(() => {
    if (loading || !isAuthenticated) return

    const disconnectionInterval = setInterval(() => {
      setCattle((prevCattle) => {
        return prevCattle.map((cow) => {
          // 10% de probabilidad de cambiar el estado de conexión
          if (Math.random() < 0.1) {
            return {
              ...cow,
              connected: !cow.connected,
            }
          }
          return cow
        })
      })
    }, 30000) // Cada 30 segundos

    return () => clearInterval(disconnectionInterval)
  }, [loading, isAuthenticated])

  // Calcular cantidad de vacas conectadas
  const connectedCattle = cattle.filter((cow) => cow.connected).length

  return (
    <CattleContext.Provider
      value={{
        cattle,
        zones,
        loading,
        connectedCattle,
        selectedCattleId,
        setSelectedCattleId,
        selectedZoneId,
        setSelectedZoneId,
      }}
    >
      {children}
    </CattleContext.Provider>
  )
}

export function useCattle() {
  const context = useContext(CattleContext)
  if (context === undefined) {
    throw new Error("useCattle must be used within a CattleProvider")
  }
  return context
}
