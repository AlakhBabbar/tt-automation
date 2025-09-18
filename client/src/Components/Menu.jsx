import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaCalendarAlt, 
  FaBook, 
  FaUsers, 
  FaBuilding, 
  FaChevronLeft, 
  FaChevronRight,
  FaBolt,
  FaGraduationCap
} from 'react-icons/fa';
import { 
  FiCalendar, 
  FiBookOpen, 
  FiUsers, 
  FiHome 
} from 'react-icons/fi';

const Menu = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const location = useLocation();

  // Update CSS custom property when menu state changes
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--menu-width', 
      isCollapsed ? '80px' : '288px'
    );
  }, [isCollapsed]);

  const menuItems = [
    {
      path: '/',
      icon: FaCalendarAlt,
      label: 'Timetable',
      description: 'View & create schedules'
    },
    {
      path: '/courses',
      icon: FaBook,
      label: 'Courses',
      description: 'Manage course data'
    },
    {
      path: '/teachers',
      icon: FaUsers,
      label: 'Teachers',
      description: 'Manage faculty'
    },
    {
      path: '/rooms',
      icon: FaBuilding,
      label: 'Rooms',
      description: 'Manage facilities'
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`${
      isCollapsed ? 'w-20' : 'w-72'
    } h-screen bg-white border-r border-slate-200 shadow-sm transition-all duration-300 flex flex-col fixed top-0 left-0 z-40`}>
      
      {/* Header */}
      <div className={`${
        isCollapsed ? 'px-4 py-5' : 'px-6 py-5'
      } border-b border-slate-200 bg-slate-50`}>
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2 m-0">
                <FaGraduationCap className="text-slate-600" />
                TT-Automation
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1 mb-0">
                Smart Scheduling System
              </p>
            </div>
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="bg-white border border-slate-200 cursor-pointer p-2 rounded-lg shadow-sm text-sm transition-all duration-200 hover:bg-slate-50 hover:border-slate-300"
          >
            {isCollapsed ? <FaChevronRight className="text-slate-600" /> : <FaChevronLeft className="text-slate-600" />}
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-5 overflow-y-auto">
        <ul className="list-none m-0 p-0">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <li key={index} className="mb-2">
                <Link
                  to={item.path}
                  className={`
                    flex items-center 
                    ${isCollapsed ? 'px-4 py-4' : 'px-6 py-4'} 
                    mx-2 rounded-lg transition-all duration-300 no-underline
                    ${isActive(item.path) 
                      ? 'text-slate-700 bg-slate-100 border-r-4 border-slate-600' 
                      : 'text-slate-600 bg-transparent border-r-4 border-transparent hover:bg-slate-50 hover:text-slate-700'
                    }
                    relative
                  `}
                >
                  <div className={`
                    flex items-center justify-center min-w-6
                    ${isCollapsed ? 'mr-0' : 'mr-4'}
                  `}>
                    <IconComponent className="text-lg" />
                  </div>
                  
                  {!isCollapsed && (
                    <div className="flex-1">
                      <div className="font-medium text-sm mb-0.5">
                        {item.label}
                      </div>
                      <div className="text-xs opacity-70 font-normal">
                        {item.description}
                      </div>
                    </div>
                  )}

                  {/* Active indicator for collapsed state */}
                  {isActive(item.path) && isCollapsed && (
                    <div className="absolute right-4 w-1.5 h-1.5 bg-slate-600 rounded-full" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className={`
        ${isCollapsed ? 'p-4' : 'px-6 py-5'} 
        border-t border-slate-200 bg-slate-50
      `}>
        {!isCollapsed ? (
          <div className="text-center">
            <div className="text-lg mb-2 flex justify-center">
              <FaBolt className="text-slate-600" />
            </div>
            <p className="text-xs text-slate-600 font-medium m-0">
              Built by team Ayatrix
            </p>
            <p className="text-xs text-slate-400 mt-0.5 mb-0">
              Version 1.0
            </p>
          </div>
        ) : (
          <div className="text-center flex justify-center">
            <FaBolt className="text-lg text-slate-600" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;
