import React, { useState } from 'react';
import { Bell, User, Upload, Menu, X } from 'lucide-react';

export default function Organize() {
  const [formData, setFormData] = useState({
    eventName: '',
    organizerName: '',
    organizerEmail: '',
    organizerPhone: '',
    eventType: '',
    eventTheme: '',
    conductMode: '',
    eventLocation: '',
    eventDate: '',
    eventTime: '',
    receptionMode: '',
    maxParticipants: '',
    description: '',
    prizeType: '',
    eventPoster: null
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-[#0a1a1a] text-white">
      {/* Header */}
      <header className="bg-[#0d2424] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-lime-400 rounded flex items-center justify-center text-black font-bold">
                L
              </div>
              <span className="text-lg sm:text-xl font-semibold">Organize</span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <button className="text-gray-400 hover:text-white">Home</button>
              <button className="text-gray-400 hover:text-white">Calendar</button>
              <button className="text-lime-400 border-b-2 border-lime-400 pb-1">About</button>
              <button className="text-gray-400 hover:text-white">Leaderboards</button>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Right Icons */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="relative">
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </div>
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden flex flex-col space-y-4 pt-4 pb-2 border-t border-gray-700 mt-4">
              <button className="text-gray-400 hover:text-white text-left">Home</button>
              <button className="text-gray-400 hover:text-white text-left">Calendar</button>
              <button className="text-lime-400 text-left">About</button>
              <button className="text-gray-400 hover:text-white text-left">Leaderboards</button>
              <div className="flex items-center space-x-4 pt-4 border-t border-gray-700">
                <div className="relative">
                  <Bell className="w-5 h-5 text-gray-400" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </div>
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <button className="flex items-center text-lime-400 mb-4 sm:mb-6 text-sm">
          <span className="mr-2">←</span> Go back
        </button>

        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Organize an event</h1>

        <div className="bg-[#0d2424] rounded-lg p-4 sm:p-6 lg:p-8">
          {/* Banner Upload */}
          <div className="bg-[#0f3535] rounded-lg h-48 sm:h-64 flex flex-col items-center justify-center mb-6 sm:mb-8 relative border-2 border-dashed border-teal-700">
            <div className="text-center px-4">
              <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 text-teal-400">
                <svg viewBox="0 0 100 100" fill="currentColor">
                  <path d="M20,60 L35,40 L50,55 L65,35 L80,50 L80,80 L20,80 Z" />
                  <polygon points="30,25 45,40 55,30 70,45" />
                </svg>
              </div>
              <p className="text-base sm:text-lg">Upload banner image</p>
            </div>
            <button className="absolute bottom-4 right-4 w-8 h-8 bg-lime-400 rounded-full flex items-center justify-center text-black">
              ✓
            </button>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div>
              <label className="block text-sm mb-2">Name of the event *</label>
              <input
                type="text"
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
                placeholder="Decentralised LinuxTalk"
                className="w-full bg-[#0a1a1a] border border-gray-700 rounded px-4 py-2.5 sm:py-2 text-white placeholder-gray-600 text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Name of the organizer *</label>
              <input
                type="text"
                name="organizerName"
                value={formData.organizerName}
                onChange={handleChange}
                placeholder="Organizer name here"
                className="w-full bg-[#0a1a1a] border border-gray-700 rounded px-4 py-2.5 sm:py-2 text-white placeholder-gray-600 text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div>
              <label className="block text-sm mb-2">Email of the organizer *</label>
              <input
                type="email"
                name="organizerEmail"
                value={formData.organizerEmail}
                onChange={handleChange}
                className="w-full bg-[#0a1a1a] border border-gray-700 rounded px-4 py-2.5 sm:py-2 text-white text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Phone number of the organizer *</label>
              <input
                type="tel"
                name="organizerPhone"
                value={formData.organizerPhone}
                onChange={handleChange}
                placeholder="+91 PHONE NUMBER"
                className="w-full bg-[#0a1a1a] border border-gray-700 rounded px-4 py-2.5 sm:py-2 text-white placeholder-gray-600 text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Type of event */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-sm mb-3">Type of event *</label>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
              {['Regular talk', 'Hackathon', 'Conclave', 'Webinar', 'Other'].map((type) => (
                <label key={type} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="eventType"
                    value={type}
                    checked={formData.eventType === type}
                    onChange={handleChange}
                    className="mr-2 accent-lime-400 w-4 h-4"
                  />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Theme and Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div>
              <label className="block text-sm mb-2">Theme of the event *</label>
              <input
                type="text"
                name="eventTheme"
                value={formData.eventTheme}
                onChange={handleChange}
                placeholder="Responsibly Web 3 and AI era"
                className="w-full bg-[#0a1a1a] border border-gray-700 rounded px-4 py-2.5 sm:py-2 text-white placeholder-gray-600 text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Mode of Conduct *</label>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="conductMode"
                    value="Online"
                    checked={formData.conductMode === 'Online'}
                    onChange={handleChange}
                    className="mr-2 accent-lime-400 w-4 h-4"
                  />
                  <span className="text-sm">Online</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="conductMode"
                    value="Offline"
                    checked={formData.conductMode === 'Offline'}
                    onChange={handleChange}
                    className="mr-2 accent-lime-400 w-4 h-4"
                  />
                  <span className="text-sm">Offline</span>
                </label>
              </div>
            </div>
          </div>

          {/* Location, Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div>
              <label className="block text-sm mb-2">Location of the event *</label>
              <input
                type="text"
                name="eventLocation"
                value={formData.eventLocation}
                onChange={handleChange}
                className="w-full bg-[#0a1a1a] border border-gray-700 rounded px-4 py-2.5 sm:py-2 text-white text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Date & Time of the event *</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="date"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleChange}
                  className="flex-1 bg-[#0a1a1a] border border-gray-700 rounded px-4 py-2.5 sm:py-2 text-white text-sm sm:text-base"
                />
                <input
                  type="time"
                  name="eventTime"
                  value={formData.eventTime}
                  onChange={handleChange}
                  className="flex-1 bg-[#0a1a1a] border border-gray-700 rounded px-4 py-2.5 sm:py-2 text-white text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          {/* Reception Mode and Participants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div>
              <label className="block text-sm mb-2">Mode of reception *</label>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="receptionMode"
                    value="Self-approval"
                    checked={formData.receptionMode === 'Self-approval'}
                    onChange={handleChange}
                    className="mr-2 accent-lime-400 w-4 h-4"
                  />
                  <span className="text-sm">Self-approval</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="receptionMode"
                    value="Request-on-approval"
                    checked={formData.receptionMode === 'Request-on-approval'}
                    onChange={handleChange}
                    className="mr-2 accent-lime-400 w-4 h-4"
                  />
                  <span className="text-sm whitespace-nowrap">Request-on-approval</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-2">
                Number of participants allowed
              </label>
              <input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleChange}
                placeholder="100"
                className="w-full bg-[#0a1a1a] border border-gray-700 rounded px-4 py-2.5 sm:py-2 text-white placeholder-gray-600 text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-sm mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full bg-[#0a1a1a] border border-gray-700 rounded px-4 py-2.5 sm:py-2 text-white resize-none text-sm sm:text-base"
              placeholder="Event description..."
            />
          </div>

          {/* Prize Type */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-sm mb-3">Prize of the event *</label>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 mb-2">
              {['No prize', 'Cash prize', 'Merchandise', 'Activity points'].map((prize) => (
                <label key={prize} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="prizeType"
                    value={prize}
                    checked={formData.prizeType === prize}
                    onChange={handleChange}
                    className="mr-2 accent-lime-400 w-4 h-4"
                  />
                  <span className="text-sm">{prize}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2 mb-2">
              Cash prize amount / Activity point count / Merchandise count (fill more than 1 type of prize, seperate prizes using slash)
            </p>
            <input
              type="text"
              placeholder="100 / 50 / rewards to winners/participants"
              className="w-full bg-[#0a1a1a] border border-gray-700 rounded px-4 py-2.5 sm:py-2 text-white placeholder-gray-600 text-sm sm:text-base"
            />
          </div>

          {/* Event Poster */}
          <div className="mb-6 sm:mb-8">
            <label className="block text-sm mb-2">Event poster *</label>
            <button className="bg-lime-400 text-black px-6 py-2.5 sm:py-2 rounded text-sm font-medium flex items-center justify-center w-full sm:w-auto">
              <Upload className="w-4 h-4 mr-2" />
              Upload image
            </button>
          </div>

          {/* Submit Button */}
          <button className="w-full bg-lime-400 text-black py-3 sm:py-3.5 rounded font-semibold hover:bg-lime-500 transition text-base sm:text-lg">
            Submit
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-sm">
          <div>
            <h3 className="font-semibold mb-3">Lenient Tree</h3>
            <p className="text-gray-400 text-xs mb-2">Quick link to our new activity</p>
            <p className="text-gray-400 text-xs mb-2">Points and how it works</p>
            <p className="text-gray-400 text-xs">All rights reserved</p>
            <div className="flex space-x-2 mt-4">
              {['LinkedIn', 'Instagram', 'Facebook', 'YouTube', 'X'].map((social, i) => (
                <div key={i} className="w-6 h-6 bg-gray-700 rounded-full"></div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Quick Links</h3>
            <p className="text-gray-400 text-xs mb-2">Home</p>
            <p className="text-gray-400 text-xs mb-2">Calendar</p>
            <p className="text-gray-400 text-xs mb-2">About</p>
            <p className="text-gray-400 text-xs">Subscriptions</p>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Essentials</h3>
            <p className="text-gray-400 text-xs mb-2">Terms & Conditions</p>
            <p className="text-gray-400 text-xs mb-2">Privacy Policy</p>
            <p className="text-gray-400 text-xs">Blogs</p>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Partners</h3>
            <p className="text-gray-400 text-xs mb-2">UN UNITED</p>
            <p className="text-gray-400 text-xs mb-2">Digizoth</p>
            <p className="text-gray-400 text-xs">Aksys.ai</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
