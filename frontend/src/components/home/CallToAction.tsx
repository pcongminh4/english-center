import React from 'react';

const CallToAction: React.FC = () => {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 flex justify-center">
      
      {/* Container chính: Màu xanh dương + Bo góc lớn */}
      <div className="relative max-w-7xl w-full bg-blue-600 rounded-[2.5rem] p-12 md:p-20 text-center overflow-hidden shadow-2xl">
        
        {/* --- BACKGROUND PATTERN (Họa tiết chấm bi) --- */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 2px, transparent 2px)',
            backgroundSize: '32px 32px'
          }}
        ></div>

        {/* --- CONTENT --- */}
        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          
          {/* Headline */}
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Bắt đầu hành trình TOEIC của bạn ngay hôm nay
          </h2>

          {/* Subheading */}
          <p className="text-blue-100 text-lg md:text-xl leading-relaxed font-medium">
            Tham gia cùng hơn 15.000+ học viên đã bứt phá sự nghiệp với nền tảng học TOEIC ứng dụng AI thông minh.
          </p>

          {/* Buttons Group */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            
            {/* Primary Button (White) */}
            <button className="bg-white text-blue-600 font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-50 hover:-translate-y-1 transition-all duration-300">
              Tham gia khóa học TOEIC
            </button>

            {/* Secondary Button (Dark Blue) */}
            <button className="bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-md border border-blue-500 hover:bg-blue-800 hover:-translate-y-1 transition-all duration-300">
              Tư vấn lộ trình học
            </button>
            
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;