import React from 'react';
import { Brain, Bot, BookOpen, Award } from 'lucide-react';

// Định nghĩa kiểu dữ liệu cho từng bước
interface Step {
  id: number;
  icon: React.ElementType;
  title: string;
  description: string;
}

const Roadmap: React.FC = () => {
  const steps: Step[] = [
    {
      id: 1,
      icon: Brain,
      title: "1. Kiểm tra",
      description: "Làm bài test đầu vào bằng AI để đánh giá trình độ.",
    },
    {
      id: 2,
      icon: Bot,
      title: "2. Đề xuất",
      description: "AI chọn lộ trình phù hợp nhất với năng lực của bạn.",
    },
    {
      id: 3,
      icon: BookOpen,
      title: "3. Học tập",
      description: "Giáo trình thích ứng kèm hỗ trợ trực tiếp.",
    },
    {
      id: 4,
      icon: Award,
      title: "4. Đạt điểm",
      description: "Chinh phục mục tiêu và nhận chứng nhận.",
    },
  ];

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 flex justify-center overflow-hidden">
      <div className="max-w-7xl w-full text-center">
        
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-gray-900 mb-16 md:mb-24">
      Lộ trình thành công với 4 bước
      </h2>

        {/* --- ROADMAP CONTAINER --- */}
        <div className="relative">
          
          {/* CONNECTING LINE */}
          <div className="hidden md:block absolute top-10 left-[10%] right-[10%] h-0.5 bg-blue-100 -z-0" />

          {/* STEPS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-4 relative z-10">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center group">
                
                {/* ICON CIRCLE */}
                <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg ring-8 ring-gray-50 mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  <step.icon size={32} strokeWidth={2} />
                </div>

                {/* TEXT CONTENT */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-sm max-w-[200px] leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};

export default Roadmap;