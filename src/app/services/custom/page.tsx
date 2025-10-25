import React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function CustomSewingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header is global from RootLayout */}
      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Индивидуальная отшивка</h1>
          <p className="text-gray-700">Изготовим продукцию по вашим размерам и требованиям.</p>
        </div>
      </main>
      {/* Footer is global from RootLayout */}
    </div>
  );
}


