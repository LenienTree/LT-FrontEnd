import React, { useState } from "react";
import { X } from "lucide-react";

import { useNavigate } from "react-router-dom";
export default function PublishEventCard() {
    const [isVisible, setIsVisible] = useState(true);
    const navigate = useNavigate();
    if (!isVisible) return null;

    return (
        <div className="w-full max-w-5xl mx-auto mb-8 px-4">
            <div className="relative bg-gradient-to-br from-[#0D4A4A] to-[#0A3838] rounded-2xl overflow-hidden shadow-2xl border-2 border-teal-600/30">
                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-teal-900/20 to-cyan-900/20"></div>

                <div className="relative flex flex-col md:flex-row items-center justify-between p-6 md:p-8 gap-6">
                    {/* Left Content */}
                    <div className="flex-1 space-y-4">
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">
                            Do you want to publish your events?
                        </h2>
                        <p className="text-base md:text-lg text-gray-300 leading-relaxed">
                            Don't worry! We got you covered.
                            <br />
                            <span className="text-teal-300">Click Continue to publish your event for free!</span>
                        </p>
                        <button onClick={() => navigate('/profile')} className="bg-[#9AE600] hover:bg-[#8BD500] text-black font-bold py-3 px-10 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                            Continue
                        </button>
                    </div>

                    {/* Right Decorative Illustration */}
                    <div className="hidden md:flex items-center justify-center relative">
                        <img
                            src="/publish-event.png"
                            alt="Publish Event Illustration"
                            className="w-48 h-auto object-contain"
                        />
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-4 right-4 text-[#9AE600] hover:text-[#8BD500] transition-colors"
                        aria-label="Close"
                    >
                        <X size={28} strokeWidth={3} />
                    </button>
                </div>
            </div>
        </div>
    );
}
