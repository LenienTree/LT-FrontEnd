import { useState, useRef, useEffect } from "react"
import { Menu, X, LogOut, User } from "lucide-react"
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import { users } from "../../services/api";
import GlobalSearch from "./GlobalSearch";
import NotificationBell from "./NotificationBell";

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const isNavVisible = true
    const profileRef = useRef(null)
    const lastScrollY = useRef(0)
    const navigate = useNavigate()
    const location = useLocation()
    const pathname = location.pathname
    const { isAuthenticated, logout, user, loading, openAuthModal } = useAuth()
    const [profileImage, setProfileImage] = useState(null)
    const [isAdmin, setIsAdmin] = useState(false)

    // Function to check if a link is active
    const isActive = (href) => {
        if (href === '/landing') {
            return pathname === '/' || pathname === '/landing';
        }
        return pathname === href;
    }

    // Fetch profile image when user logs in
    useEffect(() => {
        if (!isAuthenticated) {
            setProfileImage(null)
            return
        }
        users.getMyProfile()
            .then(data => {
                setProfileImage(data?.profileImage ?? null)
                setIsAdmin(data?.role === 'ADMIN')
            })
            .catch(() => { })
    }, [isAuthenticated])

    // Fixed navbar: no scroll hiding behavior

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const handleLogout = () => {
        logout()
        navigate('/', { replace: true })
    }

    const navItems = [
        { name: "Home", href: "/" },
        { name: "Explore", href: "/explore" },
        { name: "Calendar", href: "/calender" },
    ]

    return (
        <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6 lg:px-10">
            {/* Unified floating pill navbar */}
            <div className="mx-auto max-w-7xl rounded-2xl bg-[#022F2E]/90 backdrop-blur-md border border-white/10 shadow-xl px-4 py-2.5">
                <div className="flex items-center gap-3">

                    {/* Logo */}
                    <Link to="/" className="flex-shrink-0 flex items-center">
                        <img src="/logo1.png" alt="LenienTree" width={44} height={44} />
                    </Link>

                    {/* Desktop nav links — centered */}
                    <nav className="hidden md:flex items-center gap-1 ml-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                                    isActive(item.href)
                                        ? 'bg-white/10 text-[#9AE600]'
                                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Search — desktop */}
                    <div className="hidden md:block">
                        <GlobalSearch />
                    </div>

                    {/* Notification bell */}
                    <NotificationBell />

                    {/* Profile / Sign In — desktop */}
                    <div className="hidden md:block relative" ref={profileRef}>
                        {loading ? null : isAuthenticated ? (
                            <>
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-2 focus:outline-none"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white overflow-hidden flex-shrink-0">
                                        {profileImage
                                            ? <img src={profileImage} alt="avatar" className="w-full h-full object-cover" />
                                            : <User size={16} />}
                                    </div>
                                    <span className="text-white text-sm font-medium hidden lg:block max-w-[120px] truncate">
                                        {user?.name ?? 'Profile'}
                                    </span>
                                </button>

                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-[#0d2b2a] border border-white/10 rounded-xl shadow-2xl py-1 z-50">
                                        {isAdmin && (
                                            <Link
                                                to="/admin"
                                                className="block px-4 py-2 text-sm text-gray-200 hover:bg-white/5 hover:text-white transition-colors"
                                                onClick={() => setIsProfileOpen(false)}
                                            >
                                                Admin Dashboard
                                            </Link>
                                        )}
                                        {(user?.isOrganizer || isAdmin) && (
                                            <Link
                                                to="/organizer/dashboard"
                                                className="block px-4 py-2 text-sm text-gray-200 hover:bg-white/5 hover:text-white transition-colors"
                                                onClick={() => setIsProfileOpen(false)}
                                            >
                                                Organizer Dashboard
                                            </Link>
                                        )}
                                        <Link
                                            to="/profile"
                                            className="block px-4 py-2 text-sm text-gray-200 hover:bg-white/5 hover:text-white transition-colors"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            View Profile
                                        </Link>
                                        <div className="border-t border-white/10 mt-1 pt-1">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 flex items-center gap-2 transition-colors"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <button
                                onClick={() => openAuthModal('login')}
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#9AE600] text-black text-sm font-semibold hover:bg-[#aef72a] active:scale-95 transition-all duration-150"
                            >
                                <User size={14} />
                                <span>Sign In</span>
                            </button>
                        )}
                    </div>

                    {/* Mobile: hamburger */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile dropdown */}
            {isMenuOpen && (
                <div className="md:hidden mx-auto max-w-7xl mt-2 rounded-2xl bg-[#022F2E]/95 backdrop-blur-md border border-white/10 shadow-xl p-4">
                    <div className="mb-3">
                        <GlobalSearch />
                    </div>
                    <nav className="flex flex-col gap-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                    isActive(item.href)
                                        ? 'bg-white/10 text-[#9AE600]'
                                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                }`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                    <div className="border-t border-white/10 mt-3 pt-3">
                        {isAuthenticated ? (
                            <div className="flex flex-col gap-1">
                                <Link
                                    to="/profile"
                                    className="px-4 py-2 rounded-xl text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    View Profile
                                </Link>
                                <button
                                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => { openAuthModal('login'); setIsMenuOpen(false); }}
                                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#9AE600] text-black text-sm font-semibold hover:bg-[#aef72a] transition-colors"
                            >
                                <User size={15} />
                                <span>Sign In</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </header>
    )
}
