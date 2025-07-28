"use client";

import { RegisterForm } from "@/components/register-form";
import dynamic from 'next/dynamic';

// Dynamischer Import der Animation
const BackgroundAnimation = dynamic(() => import('@/components/background-animation'), {
  ssr: false
})

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ backgroundColor: 'transparent' }}>
      <BackgroundAnimation />
      <RegisterForm />
    </div>
  );
}
