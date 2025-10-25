import React from 'react';
import Link from 'next/link';
import { Package, Scissors, Truck, FileText, Headphones, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ServicesSection: React.FC = () => {
  const services = [
    {
      icon: Package,
      title: 'Большой склад',
      description: 'Постоянное наличие широкого ассортимента товаров',
      features: ['5000+ товаров', 'Быстрая отгрузка', 'Контроль качества'],
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Scissors,
      title: 'Индивидуальная отшивка',
      description: 'Штучные и крупносерийные заказы по вашим размерам',
      features: ['Любые размеры', 'Выбор материалов', 'Короткие сроки'],
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: Truck,
      title: 'Собственная доставка',
      description: 'Быстрая доставка собственным автотранспортом',
      features: ['По Москве и области', 'Точные сроки', 'Доставка до двери'],
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: FileText,
      title: 'Работа с документами',
      description: 'Полный пакет документов для юридических лиц',
      features: ['Договоры', 'Счета и накладные', 'Отчётность'],
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      icon: Headphones,
      title: 'Персональный менеджер',
      description: 'Индивидуальный подход к каждому клиенту',
      features: ['Консультации', 'Подбор товаров', 'Сопровождение'],
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      icon: Gift,
      title: 'Образцы товаров',
      description: 'Возможность заказать образцы перед покупкой',
      features: ['Бесплатные образцы', 'Быстрая отправка', 'Удобная упаковка'],
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ];

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Наши услуги
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Полный спектр услуг для удобства наших клиентов
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300 card-hover"
            >
              <div className={`inline-flex p-4 rounded-xl ${service.bgColor} mb-6`}>
                <service.icon className={`h-8 w-8 ${service.color}`} />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {service.title}
              </h3>
              
              <p className="text-gray-600 mb-4 leading-relaxed">
                {service.description}
              </p>

              <ul className="space-y-2">
                {service.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mr-3 flex-shrink-0"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-primary-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Готовы начать сотрудничество?
          </h3>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Свяжитесь с нами для обсуждения ваших потребностей и получения персонального предложения
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button id="cta-consult" size="lg" variant="secondary" className="text-primary-600">
              Получить консультацию
            </Button>
            <a
              href="https://drive.google.com/drive/folders/1xkSlPnJg_3nHcGZzTG8-HFveKZAxXdQi?usp=drive_link"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary-600">
                Скачать каталог
              </Button>
            </a>
          </div>
        </div>

        {/* Additional info */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">24/7</div>
            <div className="text-gray-600">Приём заявок</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">1-3</div>
            <div className="text-gray-600">дня на отшивку</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">100%</div>
            <div className="text-gray-600">контроль качества</div>
          </div>
        </div>
      </div>
    </section>
  );
};


