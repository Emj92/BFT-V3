"use client"

import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  role: string
  isAdmin?: boolean
  isTeamOwner?: boolean
  teamId?: string
  credits: number
  bundle: string
  avatarUrl?: string
  bundleInfo?: {
    name: string
    credits: number
    maxWebsites: number
    price: number
    pricePerScan: number
  }
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/me')
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setError(null)
      } else {
        setError('Failed to fetch user data')
      }
    } catch (err) {
      setError('Error fetching user data')
      console.error('Error fetching user data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  const refreshUser = async () => {
    await fetchUserData()
  }

  const updateUser = async (userData: Partial<User>) => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        return data.user
      } else {
        throw new Error('Failed to update user')
      }
    } catch (err) {
      console.error('Error updating user:', err)
      throw err
    }
  }

  return {
    user,
    loading,
    error,
    refreshUser,
    updateUser
  }
}
