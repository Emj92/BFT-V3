"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Check } from "lucide-react"
// import Image from "next/image" - Entfernt da wir normale img tags verwenden

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-12 w-12 px-0 flex items-center justify-center rounded-full"
          aria-label={t('language.switch')}
          title={t('language.switch')}
        >
          <img
            src={language === 'de' ? '/deutschland.png' : '/america.png'}
            alt={language === 'de' ? 'Deutsch' : 'English'}
            width={32}
            height={24}
            className="rounded-sm object-cover"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]" side="bottom">
        <DropdownMenuItem
          onClick={() => setLanguage('de')}
          className="cursor-pointer flex items-center justify-between"
          style={{ fontSize: '17px' }}
        >
          <div className="flex items-center gap-2">
            <img
              src="/deutschland.png"
              alt="Deutsch"
              width={20}
              height={15}
              className="rounded-sm object-cover"
            />
            <span>Deutsch</span>
          </div>
          {language === 'de' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage('en')}
          className="cursor-pointer flex items-center justify-between"
          style={{ fontSize: '17px' }}
        >
          <div className="flex items-center gap-2">
            <img
              src="/america.png"
              alt="English"
              width={20}
              height={15}
              className="rounded-sm object-cover"
            />
            <span>English</span>
          </div>
          {language === 'en' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 