import React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function DeliveryPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header is global from RootLayout */}
      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Доставка и условия сотрудничества</h1>

          <div className="prose prose-lg max-w-none text-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900">УСЛОВИЯ СОТРУДНИЧЕСТВА</h2>
            <p>Уважаемые покупатели! Наша компания занимается только оптовой торговлей!</p>

            <ul className="list-disc pl-6 space-y-2">
              <li>мы сотрудничаем с юридическими лицами и индивидуальными предпринимателями</li>
              <li>наличие товара, оптовые цены, а также оптовый прайс-лист смотрите на нашем сайте</li>
              <li>предусмотрена система скидок от суммы заказа, скидка согласовывается индивидуально</li>
              <li>информация на сайте актуальна и обновляется 2 раза в день;</li>
              <li>заказ можно оформить через корзину на сайте, по телефону +79676123254 или отправить заявку в свободной форме на электронную почту: za-bol@yandex.ru</li>
              <li>заказ на сайте должен формироваться одним разом без ДОЗАКАЗОВ;</li>
              <li>для оформления заказа регистрироваться на сайте не обязательно;</li>
              <li>счет (резерв) действителен в течение 3 (трех) дней;</li>
              <li>форма оплаты безналичная, на расчетный счет продавца с учетом НДС;</li>
              <li>отгрузка товара осуществляется в течение 1-3 рабочих дней с момента поступления денег на счет компании;</li>
              <li>доставка по г. Красноярск бесплатная</li>
              <li>доставка до транспортных компаний бесплатная независимо от суммы заказа;</li>
              <li>более подробную информацию можно получить по телефонам: +79676123254</li>
            </ul>
          </div>
        </div>
      </main>
      {/* Footer is global from RootLayout */}
    </div>
  );
}


