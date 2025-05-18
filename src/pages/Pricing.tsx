import React from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Pricing() {
  const plans = [
    {
      name: '무료',
      price: '0',
      features: [
        '맞춤 정부지원사업 검색 추천',
        '알림서비스 1년 무료',
        '사업계획서 초안 생성(1회/일)',
      ],
      buttonText: '시작하기',
      popular: false,
      buttonLink: '/dashboard',
      buttonStyle: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
    },
    {
      name: '프로',
      price: '9,900',
      features: [
        '무료 플랜의 모든 기능 포함',
        '맞춤형 사업계획서 템플릿 제공',
      ],
      buttonText: '구독하기',
      popular: true,
      buttonLink: '/pricing',
      buttonStyle: 'bg-blue-600 text-white hover:bg-blue-700',
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            합리적인 요금제
          </h1>
          <p className="text-xl text-gray-600">
            부담 없이 시작하고, 필요할 때 업그레이드하세요
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl shadow-sm p-8 relative ${
                plan.popular ? 'border-2 border-blue-500' : ''
              } hover-card`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm">
                  프로
                </div>
              )}
              <h3 className="text-2xl font-bold mb-4 text-center">{plan.name}</h3>
              <p className="text-4xl font-bold text-center mb-6">
                {plan.price}
                {plan.price !== '문의' && (
                  <span className="text-lg font-normal">/월</span>
                )}
              </p>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link 
                to={plan.buttonLink} 
                className={`block text-center ${plan.buttonStyle} py-3 rounded-lg font-semibold transition-colors`}
              >
                {plan.buttonText}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}