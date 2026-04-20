import React from 'react';
import { Ear, BookOpen, Mic, PenLine, PlayCircle, ArrowRight } from 'lucide-react';

interface SkillCardProps {
  icon: React.ElementType;
  title: string;
  isAiScored?: boolean;
}

const SkillCard: React.FC<SkillCardProps> = ({ icon: Icon, title, isAiScored }) => {
  return (
    <div className="relative bg-white rounded-2xl p-8 
      border-2 border-gray-100 
      shadow-md shadow-gray-200/50
      hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-100/50 
      transition-all duration-300 flex flex-col items-center text-center group cursor-pointer">
      
      {isAiScored && (
        <span className="absolute -top-3 inset-x-0 mx-auto w-fit bg-gradient-to-r from-blue-400 to-indigo-400 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg z-10">
          Chấm điểm bằng AI
        </span>
      )}

      <div className="mb-6 text-blue-600 bg-blue-50 p-4 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-inner">
        <Icon strokeWidth={2.5} size={28} />
      </div>

      <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">{title}</h3>
    </div>
  );
};

const ToeicLevel: React.FC = () => {
  const skills = [
    { icon: Ear, title: "Nghe", isAiScored: false },
    { icon: BookOpen, title: "Đọc", isAiScored: false },
    { icon: Mic, title: "Nói", isAiScored: true },
    { icon: PenLine, title: "Viết", isAiScored: true },
  ];

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 flex justify-center">
      <div className="max-w-7xl w-full bg-white rounded-[3rem] py-20 px-8 md:px-16 flex flex-col items-center text-center shadow-sm border border-gray-100 relative overflow-hidden">

        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>

        {/* --- HEADING SECTION --- */}
        <div className="relative z-10 mb-16">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-6">
            Biết trình độ TOEIC <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
              hiện tại của bạn
            </span>
          </h2>

          <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Công cụ đánh giá bằng AI sẽ kiểm tra đủ 4 kỹ năng và dự đoán điểm chính xác của bạn chỉ trong vòng 20 phút.
          </p>
        </div>

        {/* --- CARDS GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full mb-16 relative z-10">
          {skills.map((skill, index) => (
            <SkillCard
              key={index}
              icon={skill.icon}
              title={skill.title}
              isAiScored={skill.isAiScored}
            />
          ))}
        </div>

        {/* --- CTA BUTTON --- */}
        <button className="group bg-blue-600 hover:bg-blue-700 text-white font-black py-5 px-10 rounded-2xl shadow-xl shadow-blue-200 transition-all duration-300 flex items-center gap-4 hover:-translate-y-1 active:scale-95">
          <PlayCircle className="w-6 h-6 fill-current" />
          <span className="text-lg tracking-tight">Bắt đầu bài kiểm tra TOEIC</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

      </div>
    </section>
  );
};

export default ToeicLevel;