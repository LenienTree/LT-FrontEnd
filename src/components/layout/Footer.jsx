import React from "react";


export default function Footer() {
    return (

        <footer className="relative  bg-[#022F2E] py-12 sm:py-16 md:py-20 overflow-hidden">
            {/* Background watermark */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 z-0 pointer-events-none">
                <span
                    className="block font-bold text-black/15 select-none"
                    style={{
                        fontFamily: "urbanist",
                        fontSize: "clamp(60px, 15vw, 250px)",
                        lineHeight: "1",
                    }}
                >
                    LENIENT
                </span>
            </div>

            <div className="container mx-auto px-4 sm:px-6 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6 md:gap-8">
                    {/* Brand Column */}
                    <div className="lg:col-span-1">
                        <h4 className="text-white text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                            Lenient Tree
                        </h4>
                        <p className="text-white/70 mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">
                            Access to events are now easy
                        </p>
                        <p className="text-white/70 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                            © 2025 The Lenient Tree
                            <br />
                            All rights reserved
                        </p>

                        {/* Social Icons */}
                        <div className="flex gap-2 sm:gap-3">
                            {/* Instagram */}
                            <a
                                href="#"
                                aria-label="Instagram"
                                className="flex items-center justify-center w-9 h-9 bg-white/10 rounded-lg text-white hover:bg-[#00e676] hover:text-[#102025] transition-all duration-300"
                            >
                                <svg
                                    className="w-5 h-5"
                                    viewBox="0 0 448 512"
                                    fill="currentColor"
                                >
                                    <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9 26.3 26.2 58 34.4 93.9 36.2 37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
                                </svg>
                            </a>

                            {/* Facebook */}
                            <a
                                href="#"
                                aria-label="Facebook"
                                className="flex items-center justify-center w-9 h-9 bg-white/10 rounded-lg text-white hover:bg-[#00e676] hover:text-[#102025] transition-all duration-300"
                            >
                                <svg
                                    className="w-5 h-5"
                                    viewBox="0 0 512 512"
                                    fill="currentColor"
                                >
                                    <path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z" />
                                </svg>
                            </a>

                            {/* Twitter/X */}
                            <a
                                href="#"
                                aria-label="Twitter"
                                className="flex items-center justify-center w-9 h-9 bg-white/10 rounded-lg text-white hover:bg-[#00e676] hover:text-[#102025] transition-all duration-300"
                            >
                                <svg
                                    className="w-5 h-5"
                                    viewBox="0 0 512 512"
                                    fill="currentColor"
                                >
                                    <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
                                </svg>
                            </a>

                            {/* LinkedIn */}
                            <a
                                href="#"
                                aria-label="LinkedIn"
                                className="flex items-center justify-center w-9 h-9 bg-white/10 rounded-lg text-white hover:bg-[#00e676] hover:text-[#102025] transition-all duration-300"
                            >
                                <svg
                                    className="w-5 h-5"
                                    viewBox="0 0 448 512"
                                    fill="currentColor"
                                >
                                    <path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links Column */}
                    <div className="">
                        <h4 className="text-[#9ef01a] font-bold text-base sm:text-lg mb-4 sm:mb-6">
                            Quick Links
                        </h4>
                        <ul className="space-y-3 sm:space-y-4">
                            <li>
                                <a
                                    href="#"
                                    className="text-white/80 hover:text-[#9ef01a] transition-colors duration-300"
                                >
                                    Home
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="text-white/80 hover:text-[#9ef01a] transition-colors duration-300"
                                >
                                    Calendar
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="text-white/80 hover:text-[#9ef01a] transition-colors duration-300"
                                >
                                    About
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="text-white/80 hover:text-[#9ef01a] transition-colors duration-300"
                                >
                                    Subscriptions
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Essentials Column */}
                    <div className="">
                        <h4 className="text-[#9ef01a] font-bold text-base sm:text-lg mb-4 sm:mb-6">
                            Essentials
                        </h4>
                        <ul className="space-y-3 sm:space-y-4">
                            <li>
                                <a
                                    href="#"
                                    className="text-white/80 hover:text-[#9ef01a] transition-colors duration-300"
                                >
                                    Terms & Conditions
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="text-white/80 hover:text-[#9ef01a] transition-colors duration-300"
                                >
                                    Privacy Policy
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="text-white/80 hover:text-[#9ef01a] transition-colors duration-300"
                                >
                                    Blogs
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Partners Column */}
                    <div>
                        <h4 className="text-[#9ef01a] font-bold text-base sm:text-lg mb-4 sm:mb-6">
                            Partners
                        </h4>
                        <ul className="space-y-3 sm:space-y-4">
                            <li>
                                <a
                                    href="#"
                                    className="text-white/80 hover:text-[#9ef01a] transition-colors duration-300"
                                >
                                    Paid Promotion
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="text-white/80 hover:text-[#9ef01a] transition-colors duration-300"
                                >
                                    Collaboration
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="text-white/80 hover:text-[#9ef01a] transition-colors duration-300"
                                >
                                    Organize an event
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>

    )
}
