import React from 'react';
import { Shield, Award, Users, Truck, Clock, CheckCircle } from 'lucide-react';

export const TrustSection: React.FC = () => {
  const features = [
    {
      icon: Award,
      title: 'Проверенное качество',
      description: 'Работаем только с надежными производителями и проверенными брендами',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      icon: CheckCircle,
      title: 'Широкий выбор',
      description: 'Большой каталог одежды и аксессуаров для любого стиля и случая',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Truck,
      title: 'Быстрая доставка',
      description: 'Доставляем заказы по всей России в кратчайшие сроки',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Clock,
      title: 'Актуальные тренды',
      description: 'Следим за модными тенденциями и регулярно обновляем ассортимент',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: Shield,
      title: 'Гарантия качества',
      description: 'Все товары проходят строгий контроль качества перед отправкой',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      icon: Users,
      title: 'Довольные клиенты',
      description: 'Тысячи клиентов доверяют нам свой стиль и выбирают нас снова',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ];

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent bg-clip-text text-transparent mb-4">
            Почему выбирают нас
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            «Стили Города» — ваш надёжный партнёр в мире городской моды. 
            Мы предлагаем качественную продукцию и безупречный сервис.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300 card-hover"
            >
              <div className={`inline-flex p-3 rounded-lg ${feature.bgColor} mb-4`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Statistics */}
        <div className="mt-16 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 shadow-sm border border-purple-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent bg-clip-text text-transparent mb-2">1000+</div>
              <div className="text-gray-700 font-medium">товаров в каталоге</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent bg-clip-text text-transparent mb-2">24ч</div>
              <div className="text-gray-700 font-medium">быстрая доставка</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent bg-clip-text text-transparent mb-2">99%</div>
              <div className="text-gray-700 font-medium">довольных клиентов</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent bg-clip-text text-transparent mb-2">5★</div>
              <div className="text-gray-700 font-medium">средняя оценка</div>
            </div>
          </div>
        </div>

        {/* Testimonial removed by request */}
      </div>
    </section>
  );
};


