import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2, Calendar, Award, CheckCircle, AlertTriangle, MessageSquare } from "lucide-react";
import { notifications } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

export default function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch initial count
    fetchUnreadCount();

    // Set up polling (every 30 seconds)
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const data = await notifications.getUnreadCount();
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Fetch notifications when opening
      fetchNotifications(1, true);
    }
  };

  const fetchNotifications = async (pageNum = 1, reset = false) => {
    try {
      const data = await notifications.getNotifications(pageNum, 10);
      if (reset) {
        setItems(data.notifications);
      } else {
        setItems((prev) => [...prev, ...data.notifications]);
      }
      setHasMore(data.pagination.page < data.pagination.totalPages);
      setPage(pageNum);
      // Synchronize unread count
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notifications.markRead([id]);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notifications.markAllRead();
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await notifications.deleteNotification(id);
      const isUnread = items.find((item) => item.id === id)?.isRead === false;
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (isUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const getIcon = (type) => {
    const className = "w-4 h-4";
    switch (type) {
      case "EVENT_APPROVED":
      case "REGISTRATION_CONFIRMED":
      case "REGISTRATION_APPROVED":
        return <CheckCircle className={`${className} text-emerald-400`} />;
      case "EVENT_REJECTED":
      case "REGISTRATION_REJECTED":
      case "EVENT_CANCELLED":
        return <AlertTriangle className={`${className} text-rose-400`} />;
      case "CERTIFICATE_ISSUED":
        return <Award className={`${className} text-amber-400`} />;
      case "EVENT_UPDATED":
        return <Calendar className={`${className} text-blue-400`} />;
      case "ANNOUNCEMENT":
        return <MessageSquare className={`${className} text-[#6fff54]`} />;
      default:
        return <Bell className={`${className} text-gray-400`} />;
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-300 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all duration-200 focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-[#102025] animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-[#1b2b30]/95 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden z-50">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs bg-rose-500/20 text-rose-400 rounded-full font-medium">
                  {unreadCount} new
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-[#9AE600] hover:text-[#b4f033] font-medium flex items-center gap-1 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List Container */}
          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {items.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No notifications yet.</p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 flex gap-3 transition-colors hover:bg-white/5 relative group ${
                    !item.isRead ? "bg-white/[0.02]" : ""
                  }`}
                >
                  {/* Status marker */}
                  {!item.isRead && (
                    <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-rose-500 rounded-full" />
                  )}

                  {/* Icon */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    {getIcon(item.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-grow min-w-0">
                    <p className="text-xs font-semibold text-white leading-tight">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-300 mt-1 leading-snug break-words">
                      {item.message}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex-shrink-0 flex gap-1 self-start opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    {!item.isRead && (
                      <button
                        onClick={(e) => handleMarkRead(item.id, e)}
                        className="p-1 text-gray-400 hover:text-emerald-400 hover:bg-white/5 rounded transition-all"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-1 text-gray-400 hover:text-rose-400 hover:bg-white/5 rounded transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Load More */}
            {hasMore && (
              <button
                onClick={() => fetchNotifications(page + 1)}
                className="w-full py-2.5 text-center text-xs text-gray-400 hover:text-white font-medium hover:bg-white/5 transition-all"
              >
                Load older notifications
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
