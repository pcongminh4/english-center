import React from 'react';
import { Mic, CheckCircle2 } from 'lucide-react';

const AiFeedback: React.FC = () => {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 flex justify-center">
      {/* Container chính */}
      <div className="max-w-7xl w-full bg-[#0f172a] rounded-3xl p-8 md:p-16 overflow-hidden shadow-2xl flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        
        {/* --- LEFT COLUMN --- */}
        <div className="flex-1 space-y-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6 leading-tight">
              Phản hồi AI nâng cao
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              Không chỉ luyện tập — mà còn tiến bộ. AI của chúng tôi phân tích bài nói và bài viết theo thời gian thực, chỉ ra chính xác điểm cần cải thiện để tối ưu điểm TOEIC của bạn.
            </p>
          </div>

          <div className="space-y-6">
            {/* Feature 1 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-900/30 flex items-center justify-center border border-blue-800">
                <Mic className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h4 className="text-white font-bold text-lg">Công cụ chấm phát âm</h4>
                <p className="text-gray-500 text-sm mt-1">
                  Phân tích sóng âm và trọng âm từng âm tiết.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-900/30 flex items-center justify-center border border-green-800">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h4 className="text-white font-bold text-lg">Sửa ngữ pháp thông minh</h4>
                <p className="text-gray-500 text-sm mt-1">
                  Phân tích ngữ cảnh sâu cho văn phong doanh nghiệp.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="flex-1 w-full max-w-lg">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-800 p-1 w-full transform transition-transform hover:scale-[1.01] duration-500">
            
            {/* Terminal Header */}
            <div className="bg-white border-b border-gray-100 p-4 rounded-t-lg flex justify-between items-center">
              <span className="text-gray-400 text-xs font-mono tracking-widest uppercase">
                Bảng phân tích AI v2.4
              </span>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="p-6 md:p-8 space-y-6 bg-white rounded-b-lg font-mono text-sm">
              
              {/* User Input */}
              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">
                  Câu người học nhập:
                </p>
                <div className="p-4 bg-gray-50 rounded-lg text-gray-700 border border-gray-100">
                  "The manager <span className="bg-red-100 text-red-600 line-through decoration-red-600 decoration-2 px-1 rounded">discussed about</span> the project budget."
                </div>
              </div>

              {/* AI Suggestion */}
              <div className="space-y-2">
                <p className="text-xs text-green-600 font-bold uppercase tracking-wide">
                  Gợi ý từ AI:
                </p>
                <div className="p-4 bg-green-50 rounded-lg border border-green-100 text-gray-800">
                  <p className="mb-3">
                    "The manager <span className="bg-green-200 text-green-800 font-bold px-1.5 py-0.5 rounded shadow-sm">discussed</span> the project budget."
                  </p>
                  <p className="text-green-700 text-xs italic opacity-90">
                    Mẹo: "Discuss" là động từ trực tiếp, không cần giới từ đi kèm.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2 flex items-center gap-3 text-xs text-gray-400">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                Đang phân tích giọng điệu... Chuyên nghiệp (92%)
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default AiFeedback;