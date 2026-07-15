import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { ROLES } from '../../../constants/roleForms';

/**
 * Step 1 of signup: choose your role. Selecting one advances to the role-specific
 * signup form. Uses the existing auth-modal theme (no new styling introduced).
 */
const RoleSelect = ({ onPick, switchToLogin }) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Left Panel - Role list */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-5 py-6 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-white text-3xl sm:text-4xl font-bold mb-2">Join Lenient Tree</h1>
            <p className="text-gray-400 text-sm">First, tell us who you are.</p>
          </div>

          <div className="space-y-3">
            {ROLES.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => onPick(role.id)}
                className="group w-full flex items-center gap-4 bg-transparent border-2 border-[#1a4d4d] hover:border-[#00ff88] text-left py-3.5 px-5 rounded-xl transition-all duration-300 hover:bg-[#00ff88]/5"
              >
                <span className="text-2xl flex-shrink-0" aria-hidden="true">{role.emoji}</span>
                <span className="flex-grow min-w-0">
                  <span className="block text-white font-semibold text-sm">{role.label}</span>
                  <span className="block text-gray-400 text-xs mt-0.5">{role.desc}</span>
                </span>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-[#00ff88] flex-shrink-0 transition-colors" />
              </button>
            ))}
          </div>

          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{' '}
            <button
              type="button"
              onClick={switchToLogin || (() => navigate('/login'))}
              className="text-[#00ff88] hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>

      {/* Right Panel - Branding (mirrors Signup) */}
      <div className="hidden md:flex md:w-1/2 relative bg-gradient-to-br from-[#0d3333] to-[#0a1f1f] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-80">
          <img className="w-full h-full object-cover" src="/login-bg.png" alt="Tropical background" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1f1f]/70 via-transparent to-[#0a1f1f]/70"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-12">
          <div className="mb-auto mt-20">
            <img src="/logo1.png" alt="Lenient Tree Logo" className="w-48 h-48 object-contain drop-shadow-2xl" />
          </div>
          <div className="mb-16 text-center">
            <h2 className="text-white text-2xl font-bold mb-2">Your gateway to opportunities.</h2>
            <p className="text-gray-300 text-sm">One account, tailored to how you grow.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default RoleSelect;
