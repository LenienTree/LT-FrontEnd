import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { ROLE_FIELDS, ROLE_LABELS } from '../../../constants/roleForms';
import { users as usersApi } from '../../../services/api';

const formatDateInput = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const inputClass =
  'w-full bg-transparent border-2 border-[#1a4d4d] text-white placeholder-gray-500 py-3 px-6 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300 backdrop-blur-sm';
const selectClass =
  'w-full bg-[#0a1f1f] border-2 border-[#1a4d4d] text-white py-3 px-6 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300 backdrop-blur-sm cursor-pointer';

const Signup = ({ switchToLogin, onSuccess, role, onBack }) => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const fields = useMemo(() => ROLE_FIELDS[role] || [], [role]);

  const [values, setValues] = useState(() => {
    const init = { name: '', email: '', password: '' };
    (ROLE_FIELDS[role] || []).forEach((f) => {
      init[f.name] = f.type === 'multiselect' ? [] : '';
    });
    return init;
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

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
  const allRulesPassed = passwordRules.every((r) => r.test(values.password));

  const setField = (name, val) => setValues((prev) => ({ ...prev, [name]: val }));

  const toggleMulti = (name, option) =>
    setValues((prev) => {
      const cur = prev[name] || [];
      return { ...prev, [name]: cur.includes(option) ? cur.filter((x) => x !== option) : [...cur, option] };
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!allRulesPassed) {
      setError('Password does not meet all the required criteria.');
      setPasswordFocused(true);
      return;
    }

    // Required-field validation (base + role fields).
    if (!values.name.trim()) return setError('Please enter your name.');
    if (!values.email.trim()) return setError('Please enter your email.');

    let dobIso;
    for (const fld of fields) {
      const val = values[fld.name];
      if (fld.type === 'file') {
        if (fld.required && !resumeFile) return setError(`Please upload your ${fld.label.split('(')[0].trim().toLowerCase()}.`);
        continue;
      }
      if (fld.type === 'multiselect') {
        if (fld.required && (!val || val.length === 0)) return setError(`Please select at least one option for "${fld.label}".`);
        continue;
      }
      if (fld.type === 'date') {
        if (!val) {
          if (fld.required) return setError(`Please enter ${fld.label}.`);
          continue;
        }
        const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(val);
        if (!m) return setError('Please enter Date of Birth in DD/MM/YYYY format.');
        const [, d, mo, y] = m.map(Number);
        const dObj = new Date(y, mo - 1, d);
        if (dObj.getFullYear() !== y || dObj.getMonth() !== mo - 1 || dObj.getDate() !== d) {
          return setError('Please enter a valid Date of Birth.');
        }
        dobIso = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        continue;
      }
      if (fld.required && (!val || !String(val).trim())) {
        return setError(`Please fill in ${fld.label}.`);
      }
    }

    if (!agreeToTerms) return setError('Please accept the terms and conditions.');

    // Build the register payload: base fields at top level, profile fields nested.
    const payload = { userType: role, name: values.name, email: values.email, password: values.password };
    const profile = {};
    for (const fld of fields) {
      if (fld.type === 'file') continue;
      let val = values[fld.name];
      if (fld.type === 'tags') {
        val = String(val || '').split(',').map((s) => s.trim()).filter(Boolean);
      }
      if (fld.type === 'date') {
        if (!dobIso) continue;
        val = dobIso;
      }
      // Skip empty optional scalars so we don't send blank strings.
      if (fld.type !== 'multiselect' && (val === '' || val == null)) continue;
      if (fld.scope === 'base') payload[fld.name] = val;
      else profile[fld.name] = val;
    }
    payload.profile = profile;

    setLoading(true);
    try {
      await register(payload);
      // Professionals upload their resume right after the account is created.
      if (resumeFile) {
        try {
          await usersApi.uploadResume(resumeFile);
        } catch (uploadErr) {
          console.error('Resume upload failed after signup:', uploadErr);
        }
      }
      if (onSuccess) onSuccess();
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (fld) => {
    const val = values[fld.name];
    switch (fld.type) {
      case 'select':
        return (
          <select value={val} onChange={(e) => setField(fld.name, e.target.value)} className={selectClass} required={fld.required}>
            <option value="" disabled className="text-gray-500 bg-[#0a1f1f]">{fld.label}</option>
            {fld.options.map((opt) => (
              <option key={opt} value={opt} className="text-white bg-[#0a1f1f]">{opt}</option>
            ))}
          </select>
        );
      case 'multiselect':
        return (
          <div className="bg-[#071515] border border-[#1a4d4d] rounded-xl p-4">
            <p className="text-gray-300 text-sm font-semibold mb-3">{fld.label}</p>
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {fld.options.map((opt) => (
                <label key={opt} className="flex items-start gap-3 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(val || []).includes(opt)}
                    onChange={() => toggleMulti(fld.name, opt)}
                    className="mt-0.5 w-4 h-4 bg-transparent border-2 border-[#1a4d4d] rounded accent-[#00ff88] cursor-pointer"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        );
      case 'file':
        return (
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-2">{fld.label}</label>
            <input
              type="file"
              accept={fld.accept}
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-300 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:bg-[#00ff88] file:text-[#0a1f1f] file:font-semibold hover:file:bg-[#00cc70] cursor-pointer border-2 border-[#1a4d4d] rounded-xl p-2"
            />
          </div>
        );
      case 'date':
        return (
          <input
            type="text"
            value={val}
            onChange={(e) => setField(fld.name, formatDateInput(e.target.value))}
            placeholder={`${fld.label} (DD/MM/YYYY)`}
            maxLength={10}
            className={inputClass}
            required={fld.required}
          />
        );
      default:
        return (
          <input
            type={fld.type === 'tel' ? 'tel' : fld.type === 'url' ? 'url' : 'text'}
            value={val}
            onChange={(e) => setField(fld.name, e.target.value)}
            placeholder={fld.placeholder || fld.label}
            className={inputClass}
            required={fld.required}
          />
        );
    }
  };

  return (
    <>
      {/* Left Panel - Signup Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-5 py-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Back to role select */}
          {onBack && (
            <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-gray-400 hover:text-[#00ff88] text-sm mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Change role
            </button>
          )}

          <div className="mb-6 sm:mb-8">
            <h1 className="text-white text-3xl sm:text-4xl font-bold mb-2">Create an account</h1>
            <p className="text-gray-400 text-sm">
              Signing up as <span className="text-[#00ff88] font-medium">{ROLE_LABELS[role] || 'a member'}</span>.
            </p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-500/50 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Shared base fields */}
            <input
              type="text"
              placeholder="Enter name"
              value={values.name}
              onChange={(e) => setField('name', e.target.value)}
              className={inputClass}
              required
            />
            <input
              type="email"
              placeholder="E-mail"
              value={values.email}
              onChange={(e) => setField('email', e.target.value)}
              className={inputClass}
              required
            />

            {/* Role-specific fields */}
            {fields.map((fld) => (
              <div key={fld.name}>{renderField(fld)}</div>
            ))}

            {/* Password (shared) */}
            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={values.password}
                  onChange={(e) => setField('password', e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  className={`w-full bg-transparent border-2 text-white placeholder-gray-500 py-3 pl-6 pr-12 rounded-xl focus:outline-none transition-all duration-300 backdrop-blur-sm ${
                    values.password === '' ? 'border-[#1a4d4d] focus:border-[#00ff88]' : allRulesPassed ? 'border-[#00ff88]' : 'border-red-500'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00ff88] transition-colors focus:outline-none flex items-center justify-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {passwordFocused && (
                <div className="mt-3 px-4 py-3 bg-[#071515] border border-[#1a4d4d] rounded-xl space-y-1.5">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Password requirements</p>
                  {passwordRules.map((rule) => {
                    const passed = rule.test(values.password);
                    return (
                      <div key={rule.id} className="flex items-center gap-2">
                        <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${passed ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'bg-red-500/20 text-red-400'}`}>
                          {passed ? '✓' : '✗'}
                        </span>
                        <span className={`text-xs transition-colors duration-300 ${passed ? 'text-[#00ff88]' : 'text-red-400'}`}>{rule.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                id="agreeToTerms"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="w-5 h-5 bg-transparent border-2 border-[#1a4d4d] rounded accent-[#00ff88] cursor-pointer"
              />
              <label htmlFor="agreeToTerms" className="text-gray-400 text-sm cursor-pointer">
                I agree to the{' '}
                <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-[#00ff88] hover:underline">terms and conditions</Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-[#0a1f1f] font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-[#00ff88]/50 disabled:opacity-60 disabled:scale-100"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{' '}
            <button type="button" onClick={switchToLogin || (() => navigate('/login'))} className="text-[#00ff88] hover:underline font-medium">
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
            <button type="button" className="bg-transparent border-2 border-[#00ff88] text-white py-3 px-4 rounded-2xl text-sm font-medium hover:bg-[#00ff88]/10 transition-all duration-300 backdrop-blur-sm">Personal event calender</button>
            <button type="button" className="bg-transparent border-2 border-[#00ff88] text-white py-3 px-4 rounded-2xl text-sm font-medium hover:bg-[#00ff88]/10 transition-all duration-300 backdrop-blur-sm">Short portfolios</button>
            <button type="button" className="bg-transparent border-2 border-[#00ff88] text-white py-3 px-4 rounded-2xl text-sm font-medium hover:bg-[#00ff88]/10 transition-all duration-300 backdrop-blur-sm">Certificate gallery</button>
            <button type="button" className="bg-transparent border-2 border-[#00ff88] text-white py-3 px-4 rounded-2xl text-sm font-medium hover:bg-[#00ff88]/10 transition-all duration-300 backdrop-blur-sm">Upcoming event info</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
