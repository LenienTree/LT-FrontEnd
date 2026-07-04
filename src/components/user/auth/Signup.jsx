import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { INTEREST_OPTIONS } from '../../../constants/interests';

const formatDateInput = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  } else {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }
};

const Signup = ({ switchToLogin, onSuccess }) => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    currentRole: '',
    dateOfBirth: '',
    email: '',
    password: '',
    interests: [],
    agreeToTerms: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordRules = [
    { id: 'length', label: 'Minimum 8 characters', test: (p) => p.length >= 8 },
    { id: 'lower', label: 'At least one lowercase letter (a–z)', test: (p) => /[a-z]/.test(p) },
    { id: 'upper', label: 'At least one uppercase letter (A–Z)', test: (p) => /[A-Z]/.test(p) },
    { id: 'number', label: 'At least one number (0–9)', test: (p) => /[0-9]/.test(p) },
    { id: 'special', label: 'At least one special character (!@#$%^&*)', test: (p) => /[!@#$%^&*()\-_=+\[\]{};:'",.<>?/\\|`~]/.test(p) },
  ];

  const allRulesPassed = passwordRules.every(r => r.test(formData.password));

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;
    if (name === 'dateOfBirth') {
      val = formatDateInput(value);
    }
    setFormData(prev => ({
      ...prev,
      [name]: val
    }));
  };

  const handleInterestChange = (interest) => {
    setFormData(prev => {
      const interests = prev.interests.includes(interest)
        ? prev.interests.filter(item => item !== interest)
        : [...prev.interests, interest];

      return {
        ...prev,
        interests
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allRulesPassed) {
      setError('Password does not meet all the required criteria.');
      setPasswordFocused(true);
      return;
    }
    if (!formData.agreeToTerms) {
      setError('Please accept the terms and conditions');
      return;
    }
    if (formData.interests.length === 0) {
      setError('Please select at least one interest.');
      return;
    }

    const dobPattern = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dobPattern.test(formData.dateOfBirth)) {
      setError('Please enter Date of Birth in DD/MM/YYYY format.');
      return;
    }
    const [d, m, y] = formData.dateOfBirth.split('/').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (dateObj.getFullYear() !== y || dateObj.getMonth() !== m - 1 || dateObj.getDate() !== d) {
      setError('Please enter a valid Date of Birth.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const { agreeToTerms, ...payload } = formData;
      const formattedDob = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      await register({
        ...payload,
        dateOfBirth: formattedDob
      });
      if (onSuccess) onSuccess();
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Left Panel - Signup Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-5 py-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-white text-3xl sm:text-4xl font-bold mb-2">Create an account</h1>
            <p className="text-gray-400 text-sm">Get started with an account.</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-500/50 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                id="signup-name"
                type="text"
                name="name"
                placeholder="Enter name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-transparent border-2 border-[#1a4d4d] text-white placeholder-gray-500 py-3 px-6 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300 backdrop-blur-sm"
                required
              />
            </div>

            <div>
              <input
                id="signup-phone"
                type="tel"
                name="phone"
                placeholder="+91-99999-99999"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-transparent border-2 border-[#1a4d4d] text-white placeholder-gray-500 py-3 px-6 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300 backdrop-blur-sm"
                required
              />
            </div>

            <div>
              <select
                id="signup-current-role"
                name="currentRole"
                value={formData.currentRole}
                onChange={handleChange}
                className="w-full bg-[#0a1f1f] border-2 border-[#1a4d4d] text-white py-3 px-6 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300 backdrop-blur-sm cursor-pointer"
                required
              >
                <option value="" disabled className="text-gray-500 bg-[#0a1f1f]">Select Current Role</option>
                <option value="student" className="text-white bg-[#0a1f1f]">Student</option>
                <option value="developer" className="text-white bg-[#0a1f1f]">Developer</option>
                <option value="designer" className="text-white bg-[#0a1f1f]">Designer</option>
                <option value="founder" className="text-white bg-[#0a1f1f]">Founder</option>
                <option value="others" className="text-white bg-[#0a1f1f]">Others</option>
              </select>
            </div>

            <div>
              <input
                id="signup-dob"
                type="text"
                name="dateOfBirth"
                placeholder="Date of Birth (DD/MM/YYYY)"
                value={formData.dateOfBirth}
                onChange={handleChange}
                maxLength={10}
                className="w-full bg-transparent border-2 border-[#1a4d4d] text-white placeholder-gray-500 py-3 px-6 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300 backdrop-blur-sm"
                required
              />
            </div>

            <div>
              <input
                id="signup-email"
                type="email"
                name="email"
                placeholder="E-mail"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-transparent border-2 border-[#1a4d4d] text-white placeholder-gray-500 py-3 px-6 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300 backdrop-blur-sm"
                required
              />
            </div>

            <div>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setPasswordFocused(true)}
                  className={`w-full bg-transparent border-2 text-white placeholder-gray-500 py-3 pl-6 pr-12 rounded-xl focus:outline-none transition-all duration-300 backdrop-blur-sm ${formData.password === ''
                      ? 'border-[#1a4d4d] focus:border-[#00ff88]'
                      : allRulesPassed
                        ? 'border-[#00ff88]'
                        : 'border-red-500'
                    }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00ff88] transition-colors focus:outline-none flex items-center justify-center"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password Rules Checklist */}
              {passwordFocused && (
                <div className="mt-3 px-4 py-3 bg-[#071515] border border-[#1a4d4d] rounded-xl space-y-1.5">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Password requirements</p>
                  {passwordRules.map(rule => {
                    const passed = rule.test(formData.password);
                    return (
                      <div key={rule.id} className="flex items-center gap-2">
                        <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${passed ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'bg-red-500/20 text-red-400'
                          }`}>
                          {passed ? '✓' : '✗'}
                        </span>
                        <span className={`text-xs transition-colors duration-300 ${passed ? 'text-[#00ff88]' : 'text-red-400'
                          }`}>
                          {rule.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-[#071515] border border-[#1a4d4d] rounded-xl p-4">
              <p className="text-gray-300 text-sm font-semibold mb-3">I am interested in</p>
              <div className="space-y-2.5">
                {INTEREST_OPTIONS.map((interest) => (
                  <label key={interest} className="flex items-start gap-3 text-sm text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.interests.includes(interest)}
                      onChange={() => handleInterestChange(interest)}
                      className="mt-0.5 w-4 h-4 bg-transparent border-2 border-[#1a4d4d] rounded accent-[#00ff88] cursor-pointer"
                    />
                    <span>{interest}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                name="agreeToTerms"
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="w-5 h-5 bg-transparent border-2 border-[#1a4d4d] rounded accent-[#00ff88] cursor-pointer"
              />
              <label htmlFor="agreeToTerms" className="text-gray-400 text-sm cursor-pointer">
                I agree to the{' '}
                <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-[#00ff88] hover:underline">terms and conditions</Link>
              </label>
            </div>

            <button
              id="signup-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-[#0a1f1f] font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-[#00ff88]/50 disabled:opacity-60 disabled:scale-100"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

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

      {/* Right Panel */}
      <div className="hidden md:flex md:w-1/2 relative bg-gradient-to-br from-[#0d3333] to-[#0a1f1f] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-80">
          <img className="w-full h-full object-cover" src="/login-bg.png" alt="Tropical background" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1f1f]/70 via-transparent to-[#0a1f1f]/70"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-12">
          <div className="mb-auto mt-20">
            <img src="/logo1.png" alt="Lenient Tree Logo" className="w-48 h-48 object-contain drop-shadow-2xl" />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-12 w-full max-w-lg">
            <button className="bg-transparent border-2 border-[#00ff88] text-white py-3 px-4 rounded-2xl text-sm font-medium hover:bg-[#00ff88]/10 transition-all duration-300 backdrop-blur-sm">Personal event calender</button>
            <button className="bg-transparent border-2 border-[#00ff88] text-white py-3 px-4 rounded-2xl text-sm font-medium hover:bg-[#00ff88]/10 transition-all duration-300 backdrop-blur-sm">Short portfolios</button>
            <button className="bg-transparent border-2 border-[#00ff88] text-white py-3 px-4 rounded-2xl text-sm font-medium hover:bg-[#00ff88]/10 transition-all duration-300 backdrop-blur-sm">Certificate gallery</button>
            <button className="bg-transparent border-2 border-[#00ff88] text-white py-3 px-4 rounded-2xl text-sm font-medium hover:bg-[#00ff88]/10 transition-all duration-300 backdrop-blur-sm">Upcoming event info</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
