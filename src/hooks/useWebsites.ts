"use client"

import { useState, useEffect } from 'react'

export interface Website {
  id: string
  name: string
  url: string
  addedAt: string
  lastScan?: string
  lastScore?: number | null
  pagesCount?: number
  lastScanStatus?: string | null
}

// Fallback für localStorage während Migration
const WEBSITES_STORAGE_KEY = 'userWebsites'
const SELECTED_WEBSITE_KEY = 'selectedWebsite'

export function useWebsites() {
  const [websites, setWebsites] = useState<Website[]>([])
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Lade Websites beim ersten Laden
  useEffect(() => {
    loadWebsites()
  }, [])

  // Lade ausgewählte Website aus localStorage
  useEffect(() => {
    if (websites.length > 0) {
      const savedSelectedId = localStorage.getItem(SELECTED_WEBSITE_KEY)
      if (savedSelectedId) {
        const savedWebsite = websites.find(w => w.id === savedSelectedId)
        if (savedWebsite) {
          setSelectedWebsite(savedWebsite)
        }
      }
    }
  }, [websites])

  const selectWebsite = (website: Website | null) => {
    setSelectedWebsite(website)
    if (website) {
      localStorage.setItem(SELECTED_WEBSITE_KEY, website.id)
    } else {
      localStorage.removeItem(SELECTED_WEBSITE_KEY)
    }
  }

  const loadWebsites = async () => {
    try {
      setIsLoading(true)
      
      // NUR API - KEIN localStorage mehr
      const response = await fetch('/api/websites', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const websitesList = data.websites || []
        
        console.log('Websites von API geladen:', websitesList.length)
        setWebsites(websitesList)
        
        // Entferne localStorage komplett
        localStorage.removeItem(WEBSITES_STORAGE_KEY)
      } else {
        console.error('API-Fehler beim Laden der Websites:', response.status)
        setWebsites([]) // Leere Liste bei Fehlern
      }
    } catch (error) {
      console.error('Fehler beim Laden der Websites von API:', error)
      setWebsites([]) // Leere Liste bei Fehlern
    } finally {
      setIsLoading(false)
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(WEBSITES_STORAGE_KEY)
      if (stored) {
        const parsedWebsites = JSON.parse(stored)
        if (Array.isArray(parsedWebsites)) {
          setWebsites(parsedWebsites)
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden von localStorage:', error)
      setWebsites([])
    }
  }

  const saveToLocalStorage = (websiteList: Website[]) => {
    try {
      localStorage.setItem(WEBSITES_STORAGE_KEY, JSON.stringify(websiteList))
    } catch (error) {
      console.error('Fehler beim Speichern in localStorage:', error)
    }
  }

  const addWebsite = async (name: string, url: string): Promise<Website> => {
    try {
      console.log('Website wird hinzugefügt:', { name, url })
      
      // STRENGE Duplikat-Prüfung VOR API-Call
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`
      const existingByUrl = websites.find(w => w.url === formattedUrl)
      const existingByName = websites.find(w => w.name.toLowerCase() === name.trim().toLowerCase())
      
      if (existingByUrl || existingByName) {
        console.log('Duplikat gefunden - nicht hinzufügen')
        return existingByUrl || existingByName!
      }
      
      // NUR API - KEIN Fallback
      const response = await fetch('/api/websites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ name: name.trim(), url: formattedUrl })
      })

      if (response.ok) {
        const data = await response.json()
        const newWebsite = data.website
        
        console.log('Website erfolgreich über API hinzugefügt:', newWebsite)
        
        // Aktualisiere lokale Liste
        const updatedWebsites = [...websites, newWebsite]
        setWebsites(updatedWebsites)
        
        // Entferne localStorage komplett
        localStorage.removeItem(WEBSITES_STORAGE_KEY)
        
        // Wenn es die erste Website ist, automatisch auswählen
        if (websites.length === 0) {
          selectWebsite(newWebsite)
        }
        
        return newWebsite
      } else {
        const errorData = await response.json()
        console.error('API-Fehler beim Hinzufügen:', response.status, errorData)
        throw new Error(`API-Fehler: ${response.status} - ${errorData.error || 'Unbekannter Fehler'}`)
      }
    } catch (error) {
      console.error('Kritischer Fehler beim Hinzufügen der Website:', error)
      throw error // Fehler weiterwerfen - KEIN Fallback
    }
  }

  const removeWebsite = async (id: string) => {
    try {
      // Versuche zuerst die API zu verwenden
      const response = await fetch(`/api/websites/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        // Erfolgreich gelöscht - Liste aktualisieren
        const updatedWebsites = websites.filter(w => w.id !== id)
        setWebsites(updatedWebsites)
      } else {
        throw new Error(`API-Fehler: ${response.status}`)
      }
    } catch (error) {
      console.error('Fehler beim Löschen über API, verwende localStorage:', error)
      
      // Fallback zu localStorage
      const updatedWebsites = websites.filter(w => w.id !== id)
      setWebsites(updatedWebsites)
      saveToLocalStorage(updatedWebsites)
    }
  }

  const updateWebsite = async (id: string, updates: Partial<Website>) => {
    try {
      // Versuche zuerst die API zu verwenden
      const response = await fetch(`/api/websites/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: updates.name,
          url: updates.url
        })
      })

      if (response.ok) {
        const data = await response.json()
        const updatedWebsite = data.website
        
        // Liste aktualisieren
        const updatedWebsites = websites.map(w => 
          w.id === id ? { ...w, ...updatedWebsite } : w
        )
        setWebsites(updatedWebsites)
      } else {
        throw new Error(`API-Fehler: ${response.status}`)
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren über API, verwende localStorage:', error)
      
      // Fallback zu localStorage
      const updatedWebsites = websites.map(w => 
        w.id === id ? { ...w, ...updates } : w
      )
      setWebsites(updatedWebsites)
      saveToLocalStorage(updatedWebsites)
    }
  }

  const getWebsiteById = (id: string): Website | undefined => {
    return websites.find(w => w.id === id)
  }

  const clearAllWebsites = async () => {
    try {
      // Versuche alle Websites über API zu löschen
      for (const website of websites) {
        await removeWebsite(website.id)
      }
    } catch (error) {
      console.error('Fehler beim Löschen aller Websites über API:', error)
      // Fallback zu localStorage
      setWebsites([])
      localStorage.removeItem(WEBSITES_STORAGE_KEY)
    }
  }

  return {
    websites,
    selectedWebsite,
    isLoading,
    addWebsite,
    removeWebsite,
    updateWebsite,
    getWebsiteById,
    clearAllWebsites,
    reloadWebsites: loadWebsites,
    selectWebsite
  }
} 