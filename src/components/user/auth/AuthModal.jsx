import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import Login from './Login';
import Signup from './Signup';
import GoogleCompletion from './GoogleCompletion';

const AuthModal = () => {
    const { isAuthModalOpen, authModalView, closeAuthModal, openAuthModal, user } = useAuth();

    const isProfileIncomplete = user && (!user.phone || !user.college || !user.graduationYear || !user.dateOfBirth);

    if (!isAuthModalOpen) return null;

    // Close on backdrop click (only if profile is complete)
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && !isProfileIncomplete) {
            closeAuthModal();
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-start md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={handleBackdropClick}
        >
            <div className="relative w-full max-w-4xl bg-gradient-to-br from-[#0a1f1f] via-[#0d2626] to-[#0a1f1f] rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row my-8 border border-[#1a4d4d]">
                {/* Close Button (only if profile is complete) */}
                {!isProfileIncomplete && (
                    <button 
                        onClick={closeAuthModal} 
                        className="absolute top-4 right-4 text-gray-400 hover:text-white z-50 bg-black/20 hover:bg-black/40 rounded-full p-2 transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                )}

                {authModalView === 'login' ? (
                    <Login switchToSignup={() => openAuthModal('signup')} onSuccess={closeAuthModal} />
                ) : authModalView === 'signup' ? (
                    <Signup switchToLogin={() => openAuthModal('login')} onSuccess={closeAuthModal} />
                ) : (
                    <GoogleCompletion onSuccess={closeAuthModal} />
                )}
            </div>
        </div>
    );
};

export default AuthModal;
