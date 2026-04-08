import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../common/Navigation';

export const CourseRegistrationPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#060d4e]">
      <Navigation />
      <div className="pt-20 flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Course Registration Dashboard</h1>
          <div className="mt-8 px-8 py-10 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md max-w-lg mx-auto">
            <div className="text-slate-400 text-4xl mb-4">📋</div>
            <p className="text-slate-300 text-lg font-medium">
              Course Registration UI will be added here
            </p>
            <p className="text-slate-500 text-sm mt-2">
              This section is under development.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="mt-8 px-6 py-2 border border-white/20 text-slate-300 hover:bg-white/5 rounded-lg transition-colors text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
