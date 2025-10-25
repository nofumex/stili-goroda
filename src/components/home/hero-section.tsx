'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle, Truck, Clock, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Using public path for fallback hero image
const FALLBACK_HERO_IMAGE = '/CasaDigitalLogo.png';

export const HeroSection: React.FC = () => {
  const [heroImages, setHeroImages] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHeroImages();
  }, []);

  const loadHeroImages = async () => {
    try {
      const response = await fetch('/api/hero-images');
      const result = await response.json();
      if (result.success && result.data.length > 0) {
        setHeroImages(result.data);
      } else {
        // If no images from API, use empty array (will show static image)
        setHeroImages([]);
      }
    } catch (error) {
      console.error('Error loading hero images:', error);
      // If API fails, use empty array (will show static image)
      setHeroImages([]);
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    if (heroImages.length > 1) {
      const interval = setInterval(nextImage, 5000);
      return () => clearInterval(interval);
    }
  }, [heroImages.length]);

  const currentImage = heroImages[currentImageIndex];
  const hasImages = heroImages.length > 0;

  return (
    <section className="relative bg-gradient-to-br from-primary-50 to-white overflow-hidden">
      <div className="absolute inset-0 bg-[url('/patterns/dots.svg')] opacity-5"></div>
      
      <div className="relative container mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Image (first on mobile) */}
          <div className="relative lg:order-2 mb-8 pb-8">
            <div className="rounded-2xl overflow-hidden shadow-2xl relative bg-white">
              {loading ? (
                <div className="w-full h-96 bg-gray-200 animate-pulse flex items-center justify-center">
                  <span className="text-gray-500">Загрузка...</span>
                </div>
              ) : hasImages ? (
                <div className="relative overflow-hidden">
                  <div className="relative w-full h-96">
                    {heroImages.map((image, index) => (
                      <Image
                        key={image.id}
                        src={image.url}
                        alt={image.alt || "Главное изображение"}
                        width={800}
                        height={600}
                        quality={100}
                        unoptimized
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
                          index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                        }`}
                        priority={index === 0}
                      />
                    ))}
                  </div>
                  
                  {/* Navigation arrows */}
                  {heroImages.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
                        aria-label="Предыдущее изображение"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
                        aria-label="Следующее изображение"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </>
                  )}
                  
                  {/* Dots indicator */}
                  {heroImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
                      {heroImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            index === currentImageIndex 
                              ? 'bg-white shadow-lg scale-125' 
                              : 'bg-white/60 hover:bg-white/80 hover:scale-110'
                          }`}
                          aria-label={`Перейти к изображению ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                  <Image
                    src={FALLBACK_HERO_IMAGE}
                    alt="Главное изображение"
                    width={400}
                    height={300}
                    className="max-w-md opacity-50"
                    priority
                  />
                </div>
              )}
            </div>

            {/* Floating cards outside, slightly overlapping the image */}
            <div className="absolute -top-4 -left-4 bg-white rounded-lg p-4 shadow-lg animate-float">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">На складе</span>
              </div>
            </div>
            {/* Removed bottom-right badge by request */}

            {/* Additional info moved under image */}
            <div className="mt-10 bg-white rounded-lg p-6 shadow-sm border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">5000+</div>
                  <div className="text-sm text-gray-600">Товаров в наличии</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">24ч</div>
                  <div className="text-sm text-gray-600">Отгрузка заказа</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">99%</div>
                  <div className="text-sm text-gray-600">Довольных клиентов</div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8 lg:order-1">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                <span className="bg-gradient-to-r from-primary-600 to-accent bg-clip-text text-transparent">Стили Города</span> — 
                откройте свой стиль города
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Интернет-магазин городской одежды и аксессуаров. Стильные решения для современных людей
              </p>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-primary-600" />
                <span className="text-sm font-medium text-gray-700">Проверенное качество</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Широкий выбор</span>
              </div>
              <div className="flex items-center space-x-2">
                <Truck className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Быстрая доставка</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">Актуальные тренды</span>
              </div>
            </div>

            {/* Call to action */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/catalog">
                <Button size="xl" className="w-full sm:w-auto bg-gradient-to-r from-gradientStart to-gradientEnd hover:shadow-xl transition-all">
                  Посмотреть каталог
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button id="cta-sample" variant="outline" size="xl" className="w-full sm:w-auto border-primary-600 text-primary-600 hover:bg-primary-50">
                Связаться с нами
              </Button>
            </div>

            
          </div>

          
        </div>
      </div>
    </section>
  );
};

/* Add these styles to your globals.css */
const floatStyle = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
`;


