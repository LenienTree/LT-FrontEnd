import React from "react";

export default function OrganizeEventCTA() {
    return (
        <div className="w-full">
            <div
                className="relative rounded-t-xl bg-white overflow-hidden shadow-2xl p-8 md:p-12 lg:p-16"
            >
                {/* Topographic contour lines pattern */}
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        backgroundImage: `url("/org-event-contour.png")`,
                        backgroundSize: '800px 800px',
                        backgroundPosition: 'center'
                    }}
                ></div>

                <div className="relative z-10 text-center max-w-4xl mx-auto space-y-6">
                    {/* Heading */}
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                        Organize an event
                    </h2>

                    {/* Description */}
                    <p className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed max-w-3xl mx-auto mb-8">
                        Organize an event and publish it for maximum views. The more views the better the outcome will be.
                        We will help you reach your destined audience and do nothing to get more views than any other websites.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 pt-4">
                        {/* Learn More Button */}
                        <button className="w-full sm:w-auto bg-[#0D3838] hover:bg-[#0A2828] text-white font-semibold py-4 px-12 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                            Learn More
                        </button>

                        {/* Organize Event Button */}
                        <button className="w-full sm:w-auto bg-[#9AE600] hover:bg-[#8BD500] text-black font-bold py-4 px-12 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                            Organize Event
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
