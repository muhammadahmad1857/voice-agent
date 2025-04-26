"use client"

import { useState, useEffect } from "react"
import { LogOut, User, Trash2, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getCurrentUser, logout } from "@/app/actions/auth"
import { toast } from "sonner"

export default function UserAvatar() {
  const [userName, setUserName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true)
        const name = await getCurrentUser()
        setUserName(name)
      } catch (error) {
        console.error("Failed to fetch user:", error)
        toast.error("Failed to fetch user information")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleLogout = async () => {
    try {
      toast.loading("Logging out...")
      await logout()
    } catch (error) {
      console.error("Failed to logout:", error)
      toast.error("Failed to logout")
    }
  }

  const handleDeleteAccount = async () => {
    try {
      // Show confirmation dialog
      const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone.")

      if (confirmed) {
        toast.loading("Deleting account...")
        // In a real implementation, you would call a server action here
        // For now, we'll just simulate it with a timeout
        setTimeout(() => {
          toast.success("Account deleted successfully")
          // Redirect to login page after account deletion
          window.location.href = "/auth"
        }, 2000)
      }
    } catch (error) {
      console.error("Failed to delete account:", error)
      toast.error("Failed to delete account")
    }
  }

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-10 h-10 rounded-full bg-[#4285F4] flex items-center justify-center text-white cursor-pointer"
        onClick={toggleDropdown}
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : userName ? (
          <span className="text-sm font-medium uppercase">{userName.charAt(0)}</span>
        ) : (
          <User size={16} />
        )}
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-48 bg-[#2a2a2a] rounded-md shadow-lg z-50 overflow-hidden"
          >
            {/* User info section */}
            <div className="px-4 py-3 border-b border-gray-700">
              <p className="text-sm font-medium text-white">{userName || "User"}</p>
            </div>

            {/* Menu options */}
            <div className="py-1">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-white hover:bg-[#3a3a3a] transition-colors"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>

              <button
                onClick={handleDeleteAccount}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-[#3a3a3a] transition-colors"
              >
                <Trash2 size={16} />
                <span>Delete Account</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
