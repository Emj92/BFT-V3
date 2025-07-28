"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Crown, Sparkles, ArrowRight } from 'lucide-react'

interface PaymentSuccessDialogProps {
  open: boolean
  onClose: () => void
  packageName?: string
  packageFeatures?: string[]
}

export function PaymentSuccessDialog({ 
  open, 
  onClose, 
  packageName = "PRO", 
  packageFeatures = [] 
}: PaymentSuccessDialogProps) {
  const router = useRouter()
  
  const getPackageIcon = (pkg: string) => {
    switch (pkg) {
      case 'STARTER':
        return '🚀'
      case 'PRO':
      case 'PROFESSIONAL':
        return '⭐'
      case 'ENTERPRISE':
        return '🏢'
      default:
        return '✨'
    }
  }

  const handleGetStarted = () => {
    onClose()
    router.push('/dashboard')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <DialogTitle className="text-2xl font-bold text-green-800">
            Geschafft! 🎉
          </DialogTitle>
          
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl">{getPackageIcon(packageName)}</span>
              <Badge className="bg-blue-600 text-white px-3 py-1">
                <Crown className="w-4 h-4 mr-1" />
                {packageName} PAKET
              </Badge>
            </div>
            
            <p className="text-lg text-gray-700">
              Du kannst nun loslegen mit dem <strong>{packageName} Paket</strong>!
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-blue-800">Deine neuen Features:</span>
              </div>
              <ul className="text-sm text-blue-700 space-y-1">
                {packageFeatures.length > 0 ? (
                  packageFeatures.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      Erweiterte Scan-Limits
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      BFSG Coach verfügbar
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      PDF & Excel Export
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      Support Tickets
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-6">
          <Button 
            onClick={handleGetStarted}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Jetzt loslegen
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full"
          >
            Fenster schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook für URL-Parameter Überwachung
export function usePaymentSuccess() {
  const [showSuccess, setShowSuccess] = useState(false)
  const [packageName, setPackageName] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const payment = searchParams.get('payment')
    const bundle = searchParams.get('bundle')
    
    if (payment === 'success' && bundle) {
      setPackageName(bundle.toUpperCase())
      setShowSuccess(true)
      
      // Remove URL parameters after showing dialog
      const url = new URL(window.location.href)
      url.searchParams.delete('payment')
      url.searchParams.delete('bundle')
      router.replace(url.pathname + url.search, { scroll: false })
    }
  }, [searchParams, router])

  return {
    showSuccess,
    packageName,
    closeSuccess: () => setShowSuccess(false)
  }
} 