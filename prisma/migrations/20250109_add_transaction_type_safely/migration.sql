-- Sichere Migration: TransactionType hinzufügen OHNE Datenverlust
-- Schritt 1: Füge type-Spalte mit Default-Wert hinzu (OPTIONAL erstmal)
ALTER TABLE "CreditTransaction" ADD COLUMN "type" TEXT;

-- Schritt 2: Befülle bestehende Einträge mit sinnvollen Standard-Types
UPDATE "CreditTransaction" 
SET "type" = CASE 
    WHEN "amount" > 0 THEN 'PURCHASE'  -- Positive = Käufe
    WHEN "description" ILIKE '%scan%' THEN 'SCAN'  -- Scan-bezogen
    WHEN "description" ILIKE '%coach%' THEN 'WCAG_COACH'  -- Coach-bezogen  
    WHEN "description" ILIKE '%bfe%' OR "description" ILIKE '%generator%' THEN 'BFE_GENERATION'  -- BFE-bezogen
    ELSE 'SCAN'  -- Fallback für unbekannte negative Beträge
END
WHERE "type" IS NULL;

-- Schritt 3: Mache type-Spalte required (NOT NULL)
ALTER TABLE "CreditTransaction" ALTER COLUMN "type" SET NOT NULL;

-- Schritt 4: Erstelle TransactionType ENUM
CREATE TYPE "TransactionType" AS ENUM ('PURCHASE', 'BUNDLE_PURCHASE', 'SCAN', 'WCAG_COACH', 'BFE_GENERATION');

-- Schritt 5: Konvertiere Text-Spalte zu ENUM
ALTER TABLE "CreditTransaction" ALTER COLUMN "type" TYPE "TransactionType" USING "type"::"TransactionType";