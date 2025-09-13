import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Menu = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const menuItems = [
    {
      path: '/',
      icon: '📅',
      label: 'Timetable',
      description: 'View & create schedules'
    },
    {
      path: '/courses',
      icon: '📚',
      label: 'Courses',
      description: 'Manage course data'
    },
    {
      path: '/teachers',
      icon: '👨‍🏫',
      label: 'Teachers',
      description: 'Manage faculty'
    },
    {
      path: '/rooms',
      icon: '🏛️',
      label: 'Rooms',
      description: 'Manage facilities'
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`${
      isCollapsed ? 'w-20' : 'w-72'
    } h-screen bg-white border-r border-gray-200 shadow-lg transition-all duration-300 flex flex-col`}>
      
      {/* Header */}
      <div className={`${
        isCollapsed ? 'px-4 py-5' : 'px-6 py-5'
      } border-b border-gray-200 bg-slate-50`}>
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 m-0">
                🎓 TT-Automation
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1 mb-0">
                Smart Scheduling System
              </p>
            </div>
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="bg-white border-none cursor-pointer p-2 rounded-md shadow-sm text-base transition-all duration-200 hover:bg-slate-50"
          >
            {isCollapsed ? '➡️' : '⬅️'}
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-5 overflow-y-auto">
        <ul className="list-none m-0 p-0">
          {menuItems.map((item, index) => (
            <li key={index} className="mb-2">
              <Link
                to={item.path}
                className={`
                  flex items-center 
                  ${isCollapsed ? 'px-4 py-4' : 'px-6 py-4'} 
                  mx-2 rounded-lg transition-all duration-300 no-underline
                  ${isActive(item.path) 
                    ? 'text-indigo-600 bg-indigo-50 border-r-4 border-indigo-600' 
                    : 'text-slate-600 bg-transparent border-r-4 border-transparent hover:bg-slate-50 hover:text-slate-700'
                  }
                  relative
                `}
              >
                <span className={`
                  text-xl flex items-center justify-center min-w-6
                  ${isCollapsed ? 'mr-0' : 'mr-4'}
                `}>
                  {item.icon}
                </span>
                
                {!isCollapsed && (
                  <div className="flex-1">
                    <div className="font-semibold text-sm mb-0.5">
                      {item.label}
                    </div>
                    <div className="text-xs opacity-70 font-normal">
                      {item.description}
                    </div>
                  </div>
                )}

                {/* Active indicator for collapsed state */}
                {isActive(item.path) && isCollapsed && (
                  <div className="absolute right-4 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className={`
        ${isCollapsed ? 'p-4' : 'px-6 py-5'} 
        border-t border-gray-200 bg-slate-50
      `}>
        {!isCollapsed ? (
          <div className="text-center">
            <div className="text-2xl mb-2">
              ⚡
            </div>
            <p className="text-xs text-slate-600 font-medium m-0">
              Powered by AI
            </p>
            <p className="text-xs text-slate-400 mt-0.5 mb-0">
              Version 1.0
            </p>
          </div>
        ) : (
          <div className="text-center text-xl">
            ⚡
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;
