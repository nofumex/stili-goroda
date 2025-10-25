'use client';

import React from 'react';
import Link from 'next/link';
import { Percent, Gift, Tag, ArrowRight } from 'lucide-react';

export const PromoBanner: React.FC = () => {
  const promos = [
    {
      id: 1,
      icon: Percent,
      title: 'Скидки до 50%',
      description: 'На избранные коллекции',
      color: 'from-red-500 to-pink-500',
      link: '/catalog?sortBy=price&sortOrder=asc',
    },
    {
      id: 2,
      icon: Gift,
      title: 'Подарок при покупке',
      description: 'От 5000 ₽',
      color: 'from-purple-500 to-indigo-500',
      link: '/catalog',
    },
    {
      id: 3,
      icon: Tag,
      title: 'Новая коллекция',
      description: 'Уже в продаже',
      color: 'from-green-500 to-emerald-500',
      link: '/catalog?sortBy=createdAt&sortOrder=desc',
    },
  ];

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {promos.map((promo) => {
            const Icon = promo.icon;
            
            return (
              <Link
                key={promo.id}
                href={promo.link}
                className="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
                style={{
                  backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${promo.color}`} />
                
                {/* Pattern overlay */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
                }} />
                
                <div className="relative z-10">
                  <div className="mb-4 inline-flex p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    <Icon className="h-8 w-8" />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-2">{promo.title}</h3>
                  <p className="text-white/90 mb-4">{promo.description}</p>
                  
                  <div className="flex items-center gap-2 text-white group-hover:gap-4 transition-all duration-300">
                    <span className="font-semibold">Подробнее</span>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

