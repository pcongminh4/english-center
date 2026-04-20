import React from 'react';
import { Shield, GraduationCap, Users, TrendingUp } from 'lucide-react';

interface Props {
  onStartTest: () => void;
  onViewCourses: () => void;
}

const ToeicLanding: React.FC<Props> = ({ onStartTest, onViewCourses }) => {
  return (
    <div className="bg-gray-50 flex flex-col justify-start items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl w-full space-y-16">
        
        {/* --- HERO SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
<div className="flex flex-col items-start lg:pr-8">


  {/* Headline - Sử dụng tracking-tight và font-black để tạo sự mạnh mẽ */}
  <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[1.1] mb-6 tracking-tight">
    Chinh phục TOEIC <br />
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
      Thông minh hơn.
    </span>
  </h1>

  {/* Description - Tăng line-height và đổi màu xám nhẹ hơn */}
  <p className="text-gray-500 text-lg md:text-xl mb-10 max-w-lg leading-relaxed font-medium">
    Lộ trình cá nhân hóa từ số 0 đến 900+ với thuật toán AI độc quyền, giúp bạn tiết kiệm 40% thời gian ôn luyện.
  </p>

  {/* Buttons - Thay đổi bo góc và thêm shadow mềm */}
  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
    <button 
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center justify-center gap-2"
      onClick={onStartTest}
    >
      Thi thử miễn phí
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
    </button>
    <button 
      className="bg-white hover:bg-gray-50 text-gray-700 font-bold py-4 px-8 rounded-2xl border-2 border-gray-100 transition-all active:scale-95 text-center"
      onClick={onViewCourses}
    >
      Xem khóa học
    </button>
  </div>

  {/* Thêm Social Proof nhỏ dưới nút để tăng uy tín */}
  <div className="mt-10 flex items-center gap-3">
    <div className="flex -space-x-2">
      {[1, 2, 3].map((i) => (
        <img key={i} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" src={`https://i.pravatar.cc/100?img=${i+20}`} alt="avatar" />
      ))}
    </div>
    <p className="text-sm text-gray-400 font-medium">
      <span className="text-gray-900 font-bold">10k+</span> học viên đã đạt mục tiêu
    </p>
  </div>
</div>

          {/* Right Image Section */}
          <div className="relative">
            {/* Main Image Container */}
            <div className="rounded-2xl overflow-hidden shadow-2xl relative">
              <img 
                src="https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                alt="Lớp học" 
                className="w-full h-auto object-cover min-h-[400px]"
              />
              
              <div className="absolute inset-0 bg-blue-900/10"></div>
            </div>

            {/* Floating Card Widget */}
            <div className="absolute bottom-6 right-6 bg-white bg-opacity-95 backdrop-blur-sm p-4 rounded-xl shadow-lg flex items-center gap-4 max-w-xs animate-fade-in-up">
              <div className="bg-green-100 p-2 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Mức cải thiện TB</p>
                <p className="text-xl font-bold text-green-600">+140 điểm</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- STATS SECTION --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="bg-blue-50 p-3 rounded-full">
              <Shield className="w-8 h-8 text-blue-500 fill-current" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">98%</h3>
              <p className="text-gray-500 text-lg font-medium">Tỷ lệ thành công</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="bg-blue-50 p-3 rounded-full">
              <GraduationCap className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Cựu ETS</h3>
              <p className="text-gray-500 text-lg font-medium">Giảng viên chuyên gia</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="bg-blue-50 p-3 rounded-full">
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">&lt;15</h3>
              <p className="text-gray-500 text-lg font-medium">Sĩ số mỗi lớp</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ToeicLanding;