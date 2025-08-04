"use client"

import React, { useState } from 'react'
import { Crown, Zap, Check, CreditCard, Package } from "lucide-react"

interface UpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentBundle?: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'
  service?: string
  limitType?: 'hourly' | 'daily' | 'monthly'
  onUpgradeComplete?: () => void
}

const BUNDLE_PLANS = {
  'STARTER': {
    name: 'Starter',
    price: '9,00€',
    priceMonthly: '9,00€/Monat',
    features: [
      '200 Credits monatlich',
      'Website-Scan: 1 Credit',
      'WCAG-Coach: 5 Credits',
      'BFE-Generator: 10 Credits',
      'Erweiterte Fehleranalyse',
      'PDF-Export der Berichte',
      'E-Mail-Support'
    ],
    popular: false
  },
  'PRO': {
    name: 'Pro',
    price: '29,00€',
    priceMonthly: '29,00€/Monat',
    features: [
      '1000 Credits monatlich',
      'Website-Scan: 1 Credit',
      'WCAG-Coach: 5 Credits',
      'BFE-Generator: 10 Credits',
      'Automatische Scan-Überwachung',
      'API-Zugang',
      'Prioritäts-Support',
      'Erweiterte Berichterstellung'
    ],
    popular: true
  },
  'ENTERPRISE': {
    name: 'Enterprise',
    price: '79,00€',
    priceMonthly: '79,00€/Monat',
    features: [
      '4000 Credits monatlich',
      'Website-Scan: 1 Credit',
      'WCAG-Coach: 5 Credits',
      'BFE-Generator: 10 Credits',
      'Multi-User-Support',
      'White-Label-Berichte',
      'Dedizierter Account-Manager',
      'SLA-Garantie'
    ],
    popular: false
  },
  'TEST_PRO': {
    name: 'Test Pro',
    price: '1,00€',
    priceMonthly: '1,00€ einmalig',
    features: [
      '150 Credits (einmalig)',
      'Website-Scan: 1 Credit',
      'WCAG-Coach: 5 Credits',
      'BFE-Generator: 10 Credits',
      'Automatische Scan-Überwachung',
      'API-Zugang',
      'Prioritäts-Support',
      'Erweiterte Berichterstellung',
      '🧪 Testpaket - Löst PRO aus'
    ],
    popular: false
  }
}

const CREDIT_PACKAGES = {
  'small': {
    name: '10 Credits',
    price: '1,00€',
    credits: 10,
    description: 'Ideal für gelegentliche Nutzung'
  },
  'medium': {
    name: '25 Credits',
    price: '2,25€',
    credits: 25,
    description: 'Perfekt für regelmäßige Nutzung (10% Rabatt)'
  },
  'large': {
    name: '50 Credits',
    price: '4,00€',
    credits: 50,
    description: 'Für professionelle Anwender (20% Rabatt)'
  },
  'xl': {
    name: '100 Credits',
    price: '7,50€',
    credits: 100,
    description: 'Großes Paket (25% Rabatt)'
  },
  'xxl': {
    name: '250 Credits',
    price: '17,50€',
    credits: 250,
    description: 'Maximales Paket (30% Rabatt)'
  },
  'test': {
    name: '150 Credits Test',
    price: '1,00€',
    credits: 150,
    description: '🧪 Testpaket - 150 Credits für 1€'
  }
}

export function UpgradeDialog({ 
  open, 
  onOpenChange, 
  currentBundle = 'FREE', 
  service, 
  limitType,
  onUpgradeComplete 
}: UpgradeDialogProps) {
  const [loading, setLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'upgrade' | 'credits'>('upgrade')

  const handleUpgrade = async (bundleType: string) => {
    setLoading(true)
    try {
      // Hier würde die tatsächliche Upgrade-Logik stattfinden
      alert(`Upgrade auf ${bundleType} erfolgreich!`)
      onUpgradeComplete?.()
      onOpenChange(false)
    } catch (error) {
      alert('Upgrade fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  const handleCreditPurchase = async (packageType: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageType })
      })

      if (!response.ok) {
        throw new Error('Kauf fehlgeschlagen')
      }

      const data = await response.json()
      alert(data.message)
      onUpgradeComplete?.()
      onOpenChange(false)
    } catch (error) {
      alert('Kauf fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  const getRecommendedPlans = () => {
    const plans = Object.entries(BUNDLE_PLANS)
    if (currentBundle === 'FREE') {
      return plans
    } else if (currentBundle === 'STARTER') {
      return plans.filter(([key]) => key !== 'STARTER')
    } else if (currentBundle === 'PRO') {
      return plans.filter(([key]) => key === 'ENTERPRISE')
    }
    return []
  }

  const getLimitMessage = () => {
    if (limitType === 'hourly') {
      return 'Sie haben Ihr stündliches Limit erreicht.'
    } else if (limitType === 'daily') {
      return 'Sie haben Ihr tägliches Limit erreicht.'
    } else if (limitType === 'monthly') {
      return 'Sie haben Ihr monatliches Limit erreicht.'
    }
    return 'Sie haben Ihr Limit erreicht.'
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="h-5 w-5 text-yellow-500" />
          <h2 className="text-xl font-semibold">Limit erreicht - Zeit für ein Upgrade!</h2>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {getLimitMessage()} Wählen Sie eine Option, um weiter zu machen.
        </p>

        <div className="flex border-b mb-6">
          <button
            className={`px-4 py-2 ${selectedTab === 'upgrade' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setSelectedTab('upgrade')}
          >
            <Crown className="h-4 w-4 inline mr-2" />
            Paket upgraden
          </button>
          <button
            className={`px-4 py-2 ${selectedTab === 'credits' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setSelectedTab('credits')}
          >
            <CreditCard className="h-4 w-4 inline mr-2" />
            Credits kaufen
          </button>
        </div>

        {selectedTab === 'upgrade' && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <h3 className="text-lg font-semibold mb-2">Upgrade Ihr Paket</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Holen Sie sich unbegrenzte Nutzung und erweiterte Features
              </p>
            </div>

            <div className="grid gap-4">
              {getRecommendedPlans().map(([key, plan]) => (
                <div key={key} className={`border rounded-lg p-4 ${plan.popular ? 'border-blue-500' : 'border-gray-200'}`}>
                  {plan.popular && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded mb-2 inline-block">
                      Beliebt
                    </span>
                  )}
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-lg font-semibold">{plan.name}</h4>
                    <span className="text-2xl font-bold">{plan.price}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{plan.priceMonthly}</p>
                  
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    onClick={() => handleUpgrade(key)}
                    disabled={loading}
                    className={`w-full py-2 px-4 rounded ${plan.popular ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}
                  >
                    {loading ? 'Wird upgradet...' : `Auf ${plan.name} upgraden`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'credits' && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <h3 className="text-lg font-semibold mb-2">Einmalige Credits kaufen</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Kaufen Sie Credits für sofortige Nutzung ohne Abo
              </p>
            </div>

            <div className="grid gap-4">
              {Object.entries(CREDIT_PACKAGES).map(([key, creditPackage]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      <h4 className="text-lg font-semibold">{creditPackage.name}</h4>
                    </div>
                    <span className="text-2xl font-bold">{creditPackage.price}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{creditPackage.description}</p>
                  
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-blue-600">{creditPackage.credits}</div>
                    <div className="text-sm text-gray-600">Universal Credits</div>
                    <div className="text-xs text-gray-500 mt-1">Für alle Services verwendbar</div>
                  </div>
                  
                  <button
                    onClick={() => handleCreditPurchase(key)}
                    disabled={loading}
                    className="w-full py-2 px-4 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    {loading ? 'Wird gekauft...' : `${creditPackage.name} kaufen`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Später
          </button>
        </div>
      </div>
    </div>
  )
} 