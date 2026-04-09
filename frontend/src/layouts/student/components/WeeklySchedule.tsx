import { useState } from 'react';
import { ScheduleSessionCard } from './ScheduleSessionCard';

const DAYS = ['THỨ HAI', 'THỨ BA', 'THỨ TƯ', 'THỨ NĂM', 'THỨ SÁU', 'THỨ BẢY', 'CHỦ NHẬT'];
const DAYS_EN = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

interface Session {
  id: number;
  className: string;
  time: string;
  classroom: string;
  building: string;
  teacherName?: string;
  dayOfWeek: string;
}

interface WeeklyScheduleProps {
  sessions: Session[];
  onCheckIn: (sessionId: number) => Promise<void>;
  checkedInSessions: number[];
}

export const WeeklySchedule = ({
  sessions,
  onCheckIn,
  checkedInSessions,
}: WeeklyScheduleProps) => {
  const [currentDayIndex, _setCurrentDayIndex] = useState(
    new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  );

  // Group sessions by day
  const sessionsByDay = DAYS_EN.map((day) => {
    const daySessions = sessions.filter(s => 
      s.dayOfWeek === day
    );
    return daySessions;
  });

  const handleCheckIn = async (sessionId: number) => {
    await onCheckIn(sessionId);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Lịch học tuần này
        </h2>
        <p className="text-sm text-gray-600">
          Theo dõi lịch học của bạn
        </p>
      </div>

      {/* Desktop: Grid View */}
      <div className="hidden lg:grid lg:grid-cols-7 lg:gap-0 lg:divide-x divide-gray-200">
        {DAYS.map((day, index) => {
          const isCurrentDay = index === currentDayIndex;
          const daySessions = sessionsByDay[index];

          return (
            <div
              key={day}
              className={`
                min-h-96 p-4 transition-colors duration-200
                ${isCurrentDay ? 'bg-blue-50' : ''}
              `}
            >
              <h3
                className={`
                  text-sm font-semibold mb-4 pb-2 border-b-2
                  ${isCurrentDay 
                    ? 'text-blue-600 border-blue-600' 
                    : 'text-gray-600 border-transparent'
                  }
                `}
              >
                {day}
              </h3>

              <div className="space-y-3">
                {daySessions.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    Không có lớp
                  </p>
                ) : (
                  daySessions.map((session) => (
                    <ScheduleSessionCard
                      key={session.id}
                      className={session.className}
                      time={session.time}
                      classroom={session.classroom}
                      building={session.building}
                      teacherName={session.teacherName}
                      onCheckIn={() => handleCheckIn(session.id)}
                      isCheckedIn={checkedInSessions.includes(session.id)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: Vertical List View */}
      <div className="lg:hidden space-y-4 p-4">
        {DAYS.map((day, index) => {
          const isCurrentDay = index === currentDayIndex;
          const daySessions = sessionsByDay[index];

          return (
            <div
              key={day}
              className={`
                rounded-lg p-4 transition-colors duration-200
                ${isCurrentDay ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'}
              `}
            >
              <h3
                className={`
                  text-sm font-semibold mb-3 pb-2 border-b-2
                  ${isCurrentDay 
                    ? 'text-blue-600 border-blue-600' 
                    : 'text-gray-700 border-gray-300'
                  }
                `}
              >
                {day}
              </h3>

              <div className="space-y-3">
                {daySessions.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    Không có lớp
                  </p>
                ) : (
                  daySessions.map((session) => (
                    <ScheduleSessionCard
                      key={session.id}
                      className={session.className}
                      time={session.time}
                      classroom={session.classroom}
                      building={session.building}
                      teacherName={session.teacherName}
                      onCheckIn={() => handleCheckIn(session.id)}
                      isCheckedIn={checkedInSessions.includes(session.id)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};