import React, { useState } from 'react';
import { Bell, FileText, Search, MessageSquare, TrendingUp, Users, Award, ArrowRight, BarChart as ChartBar, Zap, Calendar, CloudLightning, Check, CreditCard, Building } from 'lucide-react';
import { Link } from 'react-router-dom';
import SearchModal from '../components/SearchModal';

export default function Landing() {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                정부지원사업을
                <br />
                <span className="gradient-text">AI로 더 쉽게</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                정부지원 프로그램 검색부터 사업계획서 작성까지,
                <br />
                AI가 도와드립니다.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link to="/dashboard" className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center">
                  시작하기 <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <button 
                  className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                  onClick={() => setIsSearchModalOpen(true)}
                >
                  <Search className="mr-2 w-5 h-5" /> 지원사업 검색
                </button>
              </div>
            </div>
            <div className="md:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800"
                alt="AI Support Illustration"
                className="rounded-lg shadow-2xl animate-float"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">주요 기능</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg hover-card">
              <Search className="w-12 h-12 text-blue-600 mb-6" />
              <h3 className="text-xl font-bold mb-4">맞춤형 검색</h3>
              <p className="text-gray-600">지역별, 산업별 맞춤 정부지원 프로그램을 쉽게 찾아보세요.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg hover-card">
              <Bell className="w-12 h-12 text-blue-600 mb-6" />
              <h3 className="text-xl font-bold mb-4">카카오톡 알림</h3>
              <p className="text-gray-600">새로운 지원사업이 등록되면 카카오톡으로 바로 알려드립니다.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg hover-card">
              <FileText className="w-12 h-12 text-blue-600 mb-6" />
              <h3 className="text-xl font-bold mb-4">AI 사업계획서</h3>
              <p className="text-gray-600">AI가 사업계획서 작성을 도와드립니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Notification Feature */}
      <section className="py-20 bg-blue-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h2 className="text-3xl font-bold mb-6">
                중요한 기회를 <span className="gradient-text">놓치지 마세요</span>
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                카카오톡 알림 서비스로 새로운 지원사업을 실시간으로 확인하세요.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  { icon: Bell, text: '맞춤형 지원사업 알림' },
                  { icon: Calendar, text: '마감일 임박 알림' },
                  { icon: CloudLightning, text: '빠른 업데이트' }
                ].map((item, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <item.icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-gray-700">{item.text}</span>
                  </li>
                ))}
              </ul>
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-700">
                      <strong>1년 무료:</strong> 첫 1년간 무료로 알림 서비스를 이용하세요. 이후에는 월 1,000원의 저렴한 가격으로 계속 이용 가능합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 md:pl-10">
              <div className="bg-white p-6 rounded-xl shadow-lg hover-card">
                <img 
                  src="https://images.unsplash.com/photo-1512314889357-e157c22f938d?auto=format&fit=crop&w=800"
                  alt="Notification Service"
                  className="rounded-lg w-full mb-6"
                />
                <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                  <Bell className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800">새로운 지원사업 알림</p>
                    <p className="text-sm text-gray-600">서울시 청년창업 특별지원 사업이 오늘 공고되었습니다. 마감일은 30일 후입니다.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Plan Feature */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row-reverse items-center">
            <div className="md:w-1/2 mb-10 md:mb-0 md:pl-10">
              <h2 className="text-3xl font-bold mb-6">
                AI로 완성하는 <span className="gradient-text">사업계획서</span>
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                복잡한 사업계획서 작성을 AI가 도와드립니다. 기본 계획부터 완성본까지 단계별로 지원합니다.
              </p>
              <div className="space-y-4 mb-8">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="font-bold text-blue-600">A</span>
                    </div>
                    <div>
                      <h4 className="font-bold">사업계획서 초안</h4>
                      <p className="text-sm text-gray-600">AI가 기본 내용을 자동으로 생성합니다.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="font-bold text-blue-600">B</span>
                    </div>
                    <div>
                      <h4 className="font-bold">완성된 사업계획서</h4>
                      <p className="text-sm text-gray-600">템플릿을 활용해 완성도 높은 계획서를 작성합니다.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-700">
                      <strong>다양한 템플릿:</strong> 기업 유형별 맞춤 템플릿을 제공합니다. 기본 템플릿은 무료, 특화 템플릿은 건당 3,000원에 이용 가능합니다.
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>AI 생성:</strong> 첫 번째 생성은 무료입니다. 추가 저장 시 건당 1,000원이 부과됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800"
                alt="AI Business Plan"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-blue-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-6">합리적인 요금제</h2>
          <p className="text-center text-xl text-gray-600 mb-12">
            부담 없이 시작하고, 필요할 때 업그레이드하세요
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-8 hover-card">
              <h3 className="text-2xl font-bold mb-4 text-center">무료</h3>
              <p className="text-4xl font-bold text-center mb-6">0원</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-600">맞춤 정부지원사업 검색 추천</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-600">알림서비스 1년 무료</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-600">사업계획서 초안 생성(1회/일)</span>
                </li>
              </ul>
              
              <Link to="/dashboard" className="block text-center bg-blue-100 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-200 transition-colors">
                시작하기
              </Link>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-blue-500 relative hover-card">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm">
                프로
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center">프로</h3>
              <p className="text-4xl font-bold text-center mb-6">9,900원<span className="text-lg font-normal">/월</span></p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-600">무료 플랜의 모든 기능 포함</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-600">맞춤형 사업계획서 템플릿 제공</span>
                </li>
              </ul>
              
              <Link to="/pricing" className="block text-center bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                구독하기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">신뢰할 수 있는 서비스</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">1,000+</div>
              <div className="text-gray-600">지원 프로그램</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">5,000+</div>
              <div className="text-gray-600">사용자</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">98%</div>
              <div className="text-gray-600">만족도</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-blue-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">이용 방법</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold mb-2">1. 기업 정보 입력</h3>
              <p className="text-gray-600">기업 정보를 입력하여 맞춤형 서비스를 받으세요.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold mb-2">2. 지원사업 검색</h3>
              <p className="text-gray-600">AI가 최적의 지원사업을 추천해드립니다.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold mb-2">3. 사업계획서 작성</h3>
              <p className="text-gray-600">AI의 도움으로 완성도 높은 사업계획서를 작성하세요.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold mb-2">4. 신청 완료</h3>
              <p className="text-gray-600">원클릭으로 간편하게 신청을 완료하세요.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">성공 사례</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                company: "테크스타트",
                industry: "IT 서비스",
                amount: "5천만원",
                description: "AI 추천으로 발견한 R&D 지원사업에 선정되어 신규 서비스 개발에 성공했습니다."
              },
              {
                company: "그린에너지",
                industry: "신재생에너지",
                amount: "2억원",
                description: "맞춤형 사업계획서 작성 도움으로 정부 지원사업 2건을 동시에 수주했습니다."
              },
              {
                company: "푸드테크",
                industry: "식품",
                amount: "3천만원",
                description: "실시간 알림으로 새로운 지원사업을 발견하여 시설 현대화를 진행했습니다."
              }
            ].map((story, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover-card">
                <ChartBar className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">{story.company}</h3>
                <div className="text-sm text-gray-500 mb-4">{story.industry} | 지원금 {story.amount}</div>
                <p className="text-gray-600">{story.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Advantage Section */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">AI의 강점</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center hover-card">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">빠른 결과</h3>
              <p className="text-gray-600">수천 개의 지원사업을 몇 초 만에 검색하고 분석합니다.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center hover-card">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">높은 정확도</h3>
              <p className="text-gray-600">AI 알고리즘으로 기업에 최적화된 지원사업을 추천합니다.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center hover-card">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">편리한 이용</h3>
              <p className="text-gray-600">언제 어디서나 쉽게 이용할 수 있는 편리한 플랫폼을 제공합니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="bg-blue-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              지금 바로 시작하세요
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              AI의 도움으로 더 쉽게 정부지원사업을 신청하세요
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/dashboard" className="inline-flex items-center justify-center bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-50 transition-colors">
                무료로 시작하기 <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link to="/pricing" className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition-colors">
                요금제 보기
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Search Modal */}
      <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
    </div>
  );
}