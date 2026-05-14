import React from 'react';

const ContactPage = () => {
    return (
        <div className="max-h-screen w-full bg-gray-900 text-white font-inter flex items-start justify-start">
            <div className=" max-w-9xl bg-[#102025] rounded-4xl shadow-xl p-2 flex flex-col lg:flex-row">
                {/* Left Section: Contact Form */}
                <div className="lg:w-1/3 p-4 lg:pr-12"> {/* Increased right padding for spacing */}
                    <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
                    <p className="text-gray-300 mb-8">
                        Feel free to contact us anytime. We'll get back to you as soon as possible.
                    </p>

                    <form className="space-y-8"> {/* Increased vertical spacing between form elements */}
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 sr-only">Full Name</label>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                placeholder="Full Name"
                                className="mt-1 block w-full py-2 px-2 bg-gray-800 border-b border-gray-600 focus:border-green-500 focus:outline-none  " // Adjusted styling
                            />
                        </div>
                        <div>
                            <label htmlFor="phoneNo" className="block text-sm font-medium text-gray-300 sr-only">Phone No.</label>
                            <input
                                type="tel"
                                id="phoneNo"
                                name="phoneNo"
                                placeholder="Phone No."
                                className="mt-1 block w-full py-2 px-2 bg-gray-800 border-b border-gray-600 focus:border-green-500 focus:outline-none  " // Adjusted styling
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 sr-only">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="Email"
                                className="mt-1 block w-full py-2 px-2 bg-gray-800 border-b border-gray-600 focus:border-green-500 focus:outline-none  " // Adjusted styling
                            />
                        </div>
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-300 sr-only">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                rows="4"
                                placeholder="Message"
                                className="mt-1 block w-full py-2 px-2 bg-gray-800 border-b border-gray-600 focus:border-green-500 focus:outline-none   resize-none" // Adjusted styling, added resize-none
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-green-500 hover:bg-green-600 text-gray-900 font-bold py-3 px-20 rounded-md shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300" // Adjusted padding and rounded corners
                        >
                            Send
                        </button>
                    </form>
                </div>

                {/* Right Section: World Map Image */}
                <div className="lg:w-2/3 p-4 lg:pl-12 mt-8 lg:mt-0 flex items-center justify-center">
                    <img
                        src="./Earth.png" // Placeholder for Earth image
                        alt="World Map"
                        className="w-full h-full object-cover rounded-lg shadow-lg"
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/800x600/4b5563/d1d5db?text=Image+Error"; }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
