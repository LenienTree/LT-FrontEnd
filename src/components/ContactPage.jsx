import React, { useState } from 'react';
import { contact } from '../services/api';

const ContactPage = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNo: '',
        email: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.fullName || !formData.email || !formData.message) {
            setErrorMessage('Please fill in all required fields.');
            return;
        }

        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            await contact.send(formData);
            setSuccessMessage('Your message has been sent successfully. We will get back to you soon!');
            setFormData({
                fullName: '',
                phoneNo: '',
                email: '',
                message: ''
            });
        } catch (error) {
            setErrorMessage(error.message || 'Failed to send message. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-h-screen w-full bg-gray-900 text-white font-inter flex items-start justify-start">
            <div className=" max-w-9xl bg-[#102025] rounded-4xl shadow-xl p-2 flex flex-col lg:flex-row">
                {/* Left Section: Contact Form */}
                <div className="lg:w-1/3 p-4 lg:pr-12"> {/* Increased right padding for spacing */}
                    <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
                    <p className="text-gray-300 mb-8">
                        Feel free to contact us anytime. We'll get back to you as soon as possible.
                    </p>

                    {successMessage && (
                        <div className="bg-green-950/80 border border-green-500/50 text-green-300 px-4 py-3 rounded-xl text-sm mb-6">
                            {successMessage}
                        </div>
                    )}
                    {errorMessage && (
                        <div className="bg-red-950/80 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl text-sm mb-6">
                            {errorMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8"> {/* Increased vertical spacing between form elements */}
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 sr-only">Full Name</label>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Full Name"
                                required
                                className="mt-1 block w-full py-2 px-2 bg-gray-800 border-b border-gray-600 focus:border-green-500 focus:outline-none  " // Adjusted styling
                            />
                        </div>
                        <div>
                            <label htmlFor="phoneNo" className="block text-sm font-medium text-gray-300 sr-only">Phone No.</label>
                            <input
                                type="tel"
                                id="phoneNo"
                                name="phoneNo"
                                value={formData.phoneNo}
                                onChange={handleChange}
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
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Email"
                                required
                                className="mt-1 block w-full py-2 px-2 bg-gray-800 border-b border-gray-600 focus:border-green-500 focus:outline-none  " // Adjusted styling
                            />
                        </div>
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-300 sr-only">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                rows="4"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Message"
                                required
                                className="mt-1 block w-full py-2 px-2 bg-gray-800 border-b border-gray-600 focus:border-green-500 focus:outline-none   resize-none" // Adjusted styling, added resize-none
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full text-gray-900 font-bold py-3 px-20 rounded-md shadow-lg transition-all duration-300 transform focus:outline-none focus:ring-4 focus:ring-green-300 ${
                                loading 
                                ? 'bg-green-700 cursor-not-allowed opacity-75' 
                                : 'bg-green-500 hover:bg-green-600 hover:scale-105'
                            }`}
                        >
                            {loading ? 'Sending...' : 'Send'}
                        </button>
                    </form>
                </div>

                {/* Right Section: World Map Image */}
                <div className="lg:w-2/3 p-4 lg:pl-12 mt-8 lg:mt-0 flex items-center justify-center">
                    <img
                        src="/Earth.png" // Placeholder for Earth image
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
