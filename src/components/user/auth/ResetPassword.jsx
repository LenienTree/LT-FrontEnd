import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const { resetPassword, openAuthModal } = useAuth();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!token) {
            setError('Reset token is missing from the URL. Please request a new link.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await resetPassword({ token, password });
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Failed to reset password. The link may have expired or is invalid.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoToLogin = () => {
        navigate('/');
        // Allow navigation to complete, then open the login modal
        setTimeout(() => {
            openAuthModal('login');
        }, 100);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a1f1f] via-[#0d2626] to-[#0a1f1f] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
            {/* Ambient decorative glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#00ff88]/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#9AE600]/5 blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Branding / Header */}
                <div className="text-center mb-8">
                    <h1 className="text-[#00ff88] text-2xl font-bold tracking-wider mb-2">Lenient Tree</h1>
                    <p className="text-gray-400 text-sm">Secure Password Recovery Portal</p>
                </div>

                {/* Card Container */}
                <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl flex flex-col justify-between">
                    {success ? (
                        <div className="text-center space-y-6 py-4">
                            <div className="flex justify-center">
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-[#00ff88] rounded-2xl">
                                    <CheckCircle2 className="w-12 h-12" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-white text-2xl font-bold mb-2">Password Reset Successful!</h2>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Your password has been changed. You can now use your new password to sign in to your account.
                                </p>
                            </div>
                            <button
                                onClick={handleGoToLogin}
                                className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-[#0a1f1f] font-bold py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-[#00ff88]/20"
                            >
                                Continue to Login <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-white text-xl font-bold mb-1">Set New Password</h2>
                                <p className="text-gray-400 text-xs">Enter your new credentials below to regain access.</p>
                            </div>

                            {/* Error Banner */}
                            {error && (
                                <div className="px-4 py-3 bg-red-900/40 border border-red-500/50 rounded-xl text-red-400 text-sm flex items-start gap-2.5">
                                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* New Password Field */}
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="New Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-transparent border-2 border-[#1a4d4d] text-white placeholder-gray-500 py-3 pl-6 pr-12 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00ff88] transition-colors focus:outline-none"
                                        disabled={loading}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>

                                {/* Confirm Password Field */}
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="Confirm New Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-transparent border-2 border-[#1a4d4d] text-white placeholder-gray-500 py-3 pl-6 pr-12 rounded-xl focus:outline-none focus:border-[#00ff88] transition-all duration-300"
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00ff88] transition-colors focus:outline-none"
                                        disabled={loading}
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-[#0a1f1f] font-bold py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-60 disabled:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-[#00ff88]/10"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Resetting Password…
                                        </>
                                    ) : (
                                        'Reset Password'
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                <div className="text-center mt-6">
                    <button
                        onClick={() => navigate('/')}
                        className="text-gray-400 hover:text-[#00ff88] text-xs font-semibold transition-all hover:underline"
                    >
                        ← Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
