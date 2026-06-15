import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { users } from "../../services/api";
import { X, CheckCircle2, ChevronRight, Briefcase, Sparkles } from "lucide-react";

export default function InternshipPopup() {
  const { user, isAuthenticated, loading, refetchUser } = useAuth();
  
  // States
  const [interest, setInterest] = useState(""); // "yes" or "no"
  const [domains, setDomains] = useState([]);
  const [otherDomain, setOtherDomain] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [dismissed, setDismissed] = useState(false);

  // Available pre-defined domains
  const availableDomains = [
    "Full Stack Development",
    "UI/UX Design",
    "Cyber Security",
    "Artificial Intelligence (AI)",
    "Data Science"
  ];

  // Initialize dismissed state from sessionStorage so it doesn't annoy user during active session
  useEffect(() => {
    const isDismissed = sessionStorage.getItem("lt_internship_dismissed") === "true";
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  // Helper to calculate age from Date of Birth string
  const getAge = (dobString) => {
    if (!dobString) return null;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = user ? getAge(user.dateOfBirth) : null;

  // Determine if popup should be shown (only for users below 23)
  const shouldShow = 
    isAuthenticated && 
    !loading && 
    user && 
    user.internshipInterest === null && 
    age !== null &&
    age < 23 &&
    !dismissed;

  if (!shouldShow) return null;

  const handleDomainChange = (domain) => {
    setDomains(prev => 
      prev.includes(domain) 
        ? prev.filter(d => d !== domain) 
        : [...prev, domain]
    );
  };

  const handleOtherCheckbox = (e) => {
    setShowOtherInput(e.target.checked);
    if (!e.target.checked) {
      setOtherDomain("");
    }
  };

  const handleClose = () => {
    sessionStorage.setItem("lt_internship_dismissed", "true");
    setDismissed(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const isInterested = interest === "yes";
      let selectedDomains = [];

      if (isInterested) {
        selectedDomains = [...domains];
        if (showOtherInput && otherDomain.trim()) {
          selectedDomains.push(otherDomain.trim());
        }

        if (selectedDomains.length === 0) {
          throw new Error("Please select at least one preferred domain.");
        }
      }

      // API Call
      await users.updateMyProfile({
        internshipInterest: isInterested,
        internshipDomains: selectedDomains
      });

      setSuccess(true);
      
      // Update local context user state
      await refetchUser();

      // Fade out popup after showing success state
      setTimeout(() => {
        setDismissed(true);
      }, 2000);

    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = 
    interest === "no" || 
    (interest === "yes" && (domains.length > 0 || (showOtherInput && otherDomain.trim() !== "")));

  return (
    <div className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:right-6 sm:left-auto z-[90] p-4 sm:p-0 w-full sm:w-[400px] animate-in slide-in-from-bottom sm:slide-in-from-right duration-500">
      <div className="relative bg-gradient-to-br from-[#0a1f1f] via-[#0d2626] to-[#0a1f1f] border border-[#1a4d4d] rounded-2xl sm:rounded-3xl shadow-2xl p-6 overflow-hidden max-h-[85vh] overflow-y-auto custom-scrollbar">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-[#00ff88]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full transition-all duration-300"
          aria-label="Dismiss survey"
        >
          <X className="w-4 h-4" />
        </button>

        {success ? (
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className="w-14 h-14 rounded-full bg-[#00ff88]/10 flex items-center justify-center mb-4 text-[#00ff88] animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Preferences Saved!</h3>
            <p className="text-gray-400 text-sm">Thank you for sharing your feedback with us.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3 pr-6">
              <div className="w-10 h-10 rounded-xl bg-[#9ae600]/10 flex items-center justify-center text-[#9ae600] shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg leading-snug">
                  Interested in Internship Opportunities?
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Let us know to match you with top partners.</p>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-xs bg-red-950/20 border border-red-500/20 rounded-xl p-3">
                {error}
              </div>
            )}

            {/* Interest Radios */}
            <div className="space-y-2.5">
              <label
                className={`flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  interest === "yes"
                    ? "border-[#00ff88] bg-[#00ff88]/5 text-white"
                    : "border-[#1a4d4d] hover:border-[#00ff88]/40 text-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="internshipInterest"
                  value="yes"
                  checked={interest === "yes"}
                  onChange={() => setInterest("yes")}
                  className="w-5 h-5 accent-[#00ff88] cursor-pointer"
                />
                <span className="text-sm font-semibold">Yes, I'm interested</span>
              </label>

              <label
                className={`flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  interest === "no"
                    ? "border-white/20 bg-white/5 text-white"
                    : "border-[#1a4d4d] hover:border-white/20 text-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="internshipInterest"
                  value="no"
                  checked={interest === "no"}
                  onChange={() => {
                    setInterest("no");
                    setDomains([]);
                    setShowOtherInput(false);
                    setOtherDomain("");
                  }}
                  className="w-5 h-5 accent-gray-400 cursor-pointer"
                />
                <span className="text-sm font-semibold">I may pass this time</span>
              </label>
            </div>

            {/* Domains Checkboxes (Conditional) */}
            {interest === "yes" && (
              <div className="space-y-3 pt-2 border-t border-[#1a4d4d] animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#00ff88] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Preferred Domains *</span>
                </div>
                
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {availableDomains.map((domain) => (
                    <label
                      key={domain}
                      className="flex items-center gap-3 px-3 py-2 bg-black/20 hover:bg-black/40 border border-[#1a4d4d] hover:border-white/10 rounded-xl cursor-pointer transition-all duration-200 group text-sm text-gray-300 hover:text-white"
                    >
                      <input
                        type="checkbox"
                        checked={domains.includes(domain)}
                        onChange={() => handleDomainChange(domain)}
                        className="w-4 h-4 accent-[#00ff88] rounded cursor-pointer"
                      />
                      <span className="group-hover:translate-x-0.5 transition-transform">{domain}</span>
                    </label>
                  ))}

                  {/* Other Checkbox */}
                  <label className="flex items-center gap-3 px-3 py-2 bg-black/20 hover:bg-black/40 border border-[#1a4d4d] hover:border-white/10 rounded-xl cursor-pointer transition-all duration-200 group text-sm text-gray-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showOtherInput}
                      onChange={handleOtherCheckbox}
                      className="w-4 h-4 accent-[#00ff88] rounded cursor-pointer"
                    />
                    <span className="group-hover:translate-x-0.5 transition-transform">Other</span>
                  </label>
                </div>

                {/* Other Input Field */}
                {showOtherInput && (
                  <input
                    type="text"
                    value={otherDomain}
                    onChange={(e) => setOtherDomain(e.target.value)}
                    placeholder="Please specify domain (e.g. Mobile Dev)"
                    className="w-full bg-[#060f0f] border border-[#1a4d4d] focus:border-[#00ff88] text-white py-2.5 px-4 rounded-xl text-sm focus:outline-none transition-all duration-300 placeholder-gray-600 animate-in slide-in-from-top-1"
                    maxLength={50}
                  />
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 text-sm"
              >
                Maybe Later
              </button>
              <button
                type="submit"
                disabled={submitting || !isValid}
                className={`flex-1 flex items-center justify-center gap-1.5 font-bold py-3 px-4 rounded-xl transition-all duration-300 text-sm ${
                  isValid && !submitting
                    ? "bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-[#0a1f1f] shadow-lg shadow-[#00ff88]/10 hover:shadow-[#00ff88]/20 transform hover:-translate-y-0.5"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
              >
                {submitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <span>Submit</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
