import React, { useState } from 'react';
import Menu from '../Components/Menu';

const TimeTable = () => {
  // Sample data structure: 2D array for timetable [day][timeSlot]
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = ['8:00-9:00', '9:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-1:00', '1:00-2:00', '2:00-3:00', '3:00-4:00'];

  const [timetable, setTimetable] = useState(
    Array(days.length).fill().map(() => Array(timeSlots.length).fill(''))
  );
  const [hoveredCell, setHoveredCell] = useState(null);
  const [institutionType, setInstitutionType] = useState('university');

  const handleCellChange = (dayIndex, slotIndex, value) => {
    const newTimetable = [...timetable];
    newTimetable[dayIndex][slotIndex] = value;
    setTimetable(newTimetable);
  };

  const clearTimetable = () => {
    setTimetable(Array(days.length).fill().map(() => Array(timeSlots.length).fill('')));
  };

  const exportTimetable = () => {
    alert('Export functionality will be implemented soon!');
  };

  return (
    <div className="flex min-h-screen">
      <Menu />
      <div className="flex-1 transition-all duration-300 p-10 bg-slate-50 min-h-screen font-sans overflow-x-auto">
        {/* Header Section */}
        <div className="text-center mb-10 bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-2xl shadow-xl text-white">
          <h1 className="text-4xl font-bold mb-2 drop-shadow-md">
            🎓 Smart Timetable Creator
          </h1>
          <p className="text-lg opacity-90">
            Create beautiful, conflict-free schedules for universities and schools
          </p>
        </div>

        {/* Institution Type Selector */}
        <div className="flex justify-center mb-8 gap-4">
          <button
            onClick={() => setInstitutionType('university')}
            className={`px-6 py-3 rounded-full text-base font-semibold cursor-pointer transition-all duration-300 border-2 border-indigo-500 ${
              institutionType === 'university'
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-white text-indigo-500 shadow-md hover:bg-indigo-50'
            }`}
          >
            🏛️ University
          </button>
          <button
            onClick={() => setInstitutionType('school')}
            className={`px-6 py-3 rounded-full text-base font-semibold cursor-pointer transition-all duration-300 border-2 border-emerald-500 ${
              institutionType === 'school'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-white text-emerald-500 shadow-md hover:bg-emerald-50'
            }`}
          >
            🏫 School
          </button>
        </div>

        {/* Timetable Container */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-200 overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 rounded-2xl overflow-hidden shadow-lg">
            <thead>
              <tr>
                <th className="p-5 bg-gradient-to-br from-slate-800 to-slate-600 text-white font-bold text-base text-center rounded-tl-2xl sticky left-0 z-10">
                  ⏰ Time Slots
                </th>
                {days.map((day, index) => (
                  <th 
                    key={index} 
                    className={`p-5 bg-gradient-to-br from-slate-800 to-slate-600 text-white font-bold text-base text-center min-w-[150px] ${
                      index === days.length - 1 ? 'rounded-tr-2xl' : ''
                    }`}
                  >
                    📅 {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot, slotIndex) => (
                <tr key={slotIndex} className={slotIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="p-4 bg-slate-100 font-semibold text-slate-600 text-center text-sm sticky left-0 z-10 border-l-4 border-gray-200">
                    {slot}
                  </td>
                  {days.map((day, dayIndex) => (
                    <td 
                      key={dayIndex} 
                      className="p-2 border border-gray-200 relative"
                      onMouseEnter={() => setHoveredCell(`${dayIndex}-${slotIndex}`)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <input
                        type="text"
                        value={timetable[dayIndex][slotIndex]}
                        onChange={(e) => handleCellChange(dayIndex, slotIndex, e.target.value)}
                        placeholder={institutionType === 'university' ? "Course • Professor • Room" : "Subject • Teacher • Room"}
                        className={`w-full p-3 rounded-lg outline-none text-sm text-gray-700 text-center transition-all duration-300 ${
                          hoveredCell === `${dayIndex}-${slotIndex}` 
                            ? 'border-2 border-indigo-500 shadow-lg shadow-indigo-500/20' 
                            : 'border-2 border-transparent shadow-sm'
                        } ${
                          timetable[dayIndex][slotIndex] 
                            ? 'bg-blue-50 font-semibold' 
                            : 'bg-white font-normal'
                        }`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex justify-center gap-5 flex-wrap">
          <button 
            onClick={() => alert('Save functionality will be implemented soon!')}
            className="px-8 py-4 bg-emerald-500 text-white border-none rounded-xl cursor-pointer text-base font-semibold shadow-lg shadow-emerald-500/30 transition-all duration-300 flex items-center gap-2 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/40"
          >
            💾 Save Timetable
          </button>
          
          <button 
            onClick={clearTimetable}
            className="px-8 py-4 bg-red-500 text-white border-none rounded-xl cursor-pointer text-base font-semibold shadow-lg shadow-red-500/30 transition-all duration-300 flex items-center gap-2 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-500/40"
          >
            🗑️ Clear All
          </button>

          <button 
            onClick={exportTimetable}
            className="px-8 py-4 bg-indigo-500 text-white border-none rounded-xl cursor-pointer text-base font-semibold shadow-lg shadow-indigo-500/30 transition-all duration-300 flex items-center gap-2 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/40"
          >
            📤 Export
          </button>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-10 p-5 bg-white rounded-2xl shadow-lg border border-gray-200">
          <p className="text-slate-600 text-sm m-0 font-medium">
            💡 Click on any cell to add classes, subjects, teachers, or room assignments
          </p>
        </div>
      </div>
    </div>
  );
};

export default TimeTable;