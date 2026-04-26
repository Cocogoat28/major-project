// src/pages/Admin.tsx
import React, { useEffect, useState } from "react";
import api from "../utils/api";
import Notification from "./Notification";

export default function AdminDashboard() {
  const [tab, setTab] = useState("dashboard");
  const [users, setUsers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalCaptains: 0,
    totalBookings: 0,
    totalSpaces: 0,
    revenue: 0,
    activeBookings: 0,
  });

  // Selection states
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedCaptains, setSelectedCaptains] = useState<string[]>([]);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<any | null>(null);

  // Filters for users
  const [isVerifiedFilter, setIsVerifiedFilter] = useState<boolean | null>(null);
  const [kycStatusFilter, setKycStatusFilter] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState<string | null>(null);

  // Filters for captains
  const [captainIsVerifiedFilter, setCaptainIsVerifiedFilter] = useState<boolean | null>(null);
  const [captainKycStatusFilter, setCaptainKycStatusFilter] = useState<string | null>(null);
  const [captainStateFilter, setCaptainStateFilter] = useState<string | null>(null);
  const [captainCityFilter, setCaptainCityFilter] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [isCaptainFilter, setIsCaptainFilter] = useState<boolean | null>(null);

  // Filters for bookings
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string | null>(null);
  const [bookingCityFilter, setBookingCityFilter] = useState<string | null>(null);

  // Filters for spaces
  const [spaceStatusFilter, setSpaceStatusFilter] = useState<string | null>(null);
  const [spaceStateFilter, setSpaceStateFilter] = useState<string | null>(null);
  const [spaceCityFilter, setSpaceCityFilter] = useState<string | null>(null);

  // View mode state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // -------------------------
  // Fetchers
  // -------------------------
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data.users || []);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err?.response?.data?.error || err?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/bookings");
      setBookings(res.data.bookings || []);
    } catch (err: any) {
      console.error("Error fetching bookings:", err);
      setError(err?.response?.data?.error || err?.message || "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const fetchSpaces = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/parkingspaces");
      setSpaces(res.data.spaces || []);
    } catch (err: any) {
      console.error("Error fetching parking spaces:", err);
      setError(err?.response?.data?.error || err?.message || "Failed to fetch parking spaces");
    } finally {
      setLoading(false);
    }
  };

  // Fetch when tab changes
  useEffect(() => {
    // Clear search & selections when switching tabs — keeps UI consistent
    setSearchTerm("");
    setSelectedUsers([]);
    setSelectedCaptains([]);
    setSelectedBookings([]);
    setSelectedSpaces([]);

    if (tab === "users" || tab === "captains") {
      fetchUsers();
    } else if (tab === "bookings") {
      fetchBookings();
    } else if (tab === "parkingspaces") {
      fetchSpaces();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Dashboard stats gatherer (runs once, and you can re-run manually if needed)
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const [usersRes, bookingsRes, spacesRes] = await Promise.all([
          api.get("/admin/users"),
          api.get("/admin/bookings"),
          api.get("/admin/parkingspaces"),
        ]);

        const allUsers = usersRes.data.users || [];
        const allBookings = bookingsRes.data.bookings || [];
        const allSpaces = spacesRes.data.spaces || [];

        const totalUsers = allUsers.length;
        const totalCaptains = allUsers.filter((u: any) => u.isCaptain).length;
        const totalBookings = allBookings.length;
        const totalSpaces = allSpaces.length;
        const activeBookings = allBookings.filter((booking: any) =>
          ["confirmed", "pending", "accepted"].includes((booking.status || "").toLowerCase())
        ).length;
        const totalRevenue = allBookings
          .filter((booking: any) => (booking.status || "").toLowerCase() === "completed")
          .reduce((sum: number, booking: any) => sum + (Number(booking.totalPrice) || 0), 0);

        setDashboardStats({
          totalUsers,
          totalCaptains,
          totalBookings,
          totalSpaces,
          activeBookings,
          revenue: totalRevenue,
        });
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      }
    };
    fetchDashboardStats();
  }, []);

  // -------------------------
  // Phone verify helpers
  // -------------------------
  const handleVerifyPhone = async (userId: string) => {
    try {
      await api.put(`/admin/users/${userId}`, { phoneVerified: true });
      alert("Phone marked as verified.");
      await fetchUsers();
    } catch (err) {
      console.error("Error verifying phone:", err);
      alert("Failed to verify phone");
    }
  };

  const handleUnverifyPhone = async (userId: string) => {
    try {
      await api.put(`/admin/users/${userId}`, { phoneVerified: false });
      alert("Phone marked as unverified.");
      await fetchUsers();
    } catch (err) {
      console.error("Error unverifying phone:", err);
      alert("Failed to unverify phone");
    }
  };

  // -------------------------
  // Bulk delete handlers
  // -------------------------
  const handleBulkDeleteUsers = async () => {
    if (selectedUsers.length === 0) {
      alert("Please select users to delete");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)?`)) {
      return;
    }
    try {
      await Promise.all(selectedUsers.map((id) => api.delete(`/admin/users/${id}`)));
      alert("Users deleted successfully");
      setSelectedUsers([]);
      fetchUsers();
    } catch (err) {
      console.error("Error deleting users:", err);
      alert("Failed to delete users");
    }
  };

  const handleBulkDeleteCaptains = async () => {
    if (selectedCaptains.length === 0) {
      alert("Please select users to delete");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${selectedCaptains.length} user(s)?`)) {
      return;
    }
    try {
      await Promise.all(selectedCaptains.map((id) => api.delete(`/admin/users/${id}`)));
      alert("Users deleted successfully");
      setSelectedCaptains([]);
      fetchUsers();
    } catch (err) {
      console.error("Error deleting users:", err);
      alert("Failed to delete users");
    }
  };

  const handleBulkDeleteBookings = async () => {
    if (selectedBookings.length === 0) {
      alert("Please select bookings to delete");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${selectedBookings.length} booking(s)?`)) {
      return;
    }
    try {
      await Promise.all(selectedBookings.map((id) => api.delete(`/admin/bookings/${id}`)));
      alert("Bookings deleted successfully");
      setSelectedBookings([]);
      fetchBookings();
    } catch (err) {
      console.error("Error deleting bookings:", err);
      alert("Failed to delete bookings");
    }
  };

  const handleBulkDeleteSpaces = async () => {
    if (selectedSpaces.length === 0) {
      alert("Please select parking spaces to delete");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${selectedSpaces.length} parking space(s)?`)) {
      return;
    }
    try {
      await Promise.all(selectedSpaces.map((id) => api.delete(`/admin/parkingspaces/${id}`)));
      alert("Parking spaces deleted successfully");
      setSelectedSpaces([]);
      fetchSpaces();
    } catch (err) {
      console.error("Error deleting parking spaces:", err);
      alert("Failed to delete parking spaces");
    }
  };

  // -------------------------
  // Filter helper functions
  // -------------------------
  const getFilteredUsers = () => {
    return users.filter((user) => {
      let match = true;
      if (isVerifiedFilter !== null) match = match && user.isVerified === isVerifiedFilter;
      if (kycStatusFilter !== null) match = match && user.kycStatus === kycStatusFilter;
      if (stateFilter !== null) match = match && user.kycData?.state === stateFilter;
      if (cityFilter !== null) match = match && user.kycData?.city === cityFilter;
      return match;
    });
  };

  const getFilteredCaptains = () => {
    return users.filter((user) => {
      let match = true;
      if (captainIsVerifiedFilter !== null) match = match && user.isVerified === captainIsVerifiedFilter;
      if (captainKycStatusFilter !== null) match = match && user.kycStatus === captainKycStatusFilter;
      if (captainStateFilter !== null) match = match && user.kycData?.state === captainStateFilter;
      if (captainCityFilter !== null) match = match && user.kycData?.city === captainCityFilter;
      if (regionFilter !== null) match = match && user.region === regionFilter;
      if (isCaptainFilter !== null) match = match && user.isCaptain === isCaptainFilter;
      return match && (user.isCaptain === true || user.isCaptain === false); // keep structure consistent
    }).filter(Boolean);
  };

  const getFilteredBookings = () => {
    return bookings.filter((booking) => {
      let match = true;
      if (bookingStatusFilter !== null) match = match && booking.status === bookingStatusFilter;
      if (bookingCityFilter !== null) match = match && booking.parkingSpace?.address?.city === bookingCityFilter;
      return match;
    });
  };

  const getFilteredSpaces = () => {
    return spaces.filter((space) => {
      let match = true;
      if (spaceStatusFilter !== null) match = match && space.status === spaceStatusFilter;
      if (spaceStateFilter !== null) match = match && space.address?.state === spaceStateFilter;
      if (spaceCityFilter !== null) match = match && space.address?.city === spaceCityFilter;
      return match;
    });
  };

  // -------------------------
  // Selection toggle helpers (MISSING functions fixed)
  // -------------------------
  const toggleSelectionInArray = (arr: string[], setArr: (v: string[]) => void, id: string) => {
    if (arr.includes(id)) {
      setArr(arr.filter((i) => i !== id));
    } else {
      setArr([...arr, id]);
    }
  };

  const toggleUserSelection = (id: string) => {
    toggleSelectionInArray(selectedUsers, setSelectedUsers, id);
  };

  const toggleCaptainSelection = (id: string) => {
    toggleSelectionInArray(selectedCaptains, setSelectedCaptains, id);
  };

  const toggleBookingSelection = (id: string) => {
    toggleSelectionInArray(selectedBookings, setSelectedBookings, id);
  };

  const toggleSpaceSelection = (id: string) => {
    toggleSelectionInArray(selectedSpaces, setSelectedSpaces, id);
  };

  // -------------------------
  // Small UI helpers
  // -------------------------
  const UserCard = ({ user, onEdit, selected, onSelect }: any) => (
    <div className={`bg-white rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
      selected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
    }`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              {(user.name || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{user.name || "Unknown"}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={!!selected}
            onChange={onSelect}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-gray-500">Phone:</span>
            <p className="font-medium">{user.phone || "—"}</p>
          </div>
          <div>
            <span className="text-gray-500">Status:</span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              user.isAdmin ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"
            }`}>
              {user.isAdmin ? "Admin" : "User"}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Email Verified:</span>
            <span className={user.isVerified ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
              {user.isVerified ? "Yes" : "No"}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Phone Verified:</span>
            <span className={user.phoneVerified ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
              {user.phoneVerified ? "Yes" : "No"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(user)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Edit
            </button>
            {user.phone && (
              user.phoneVerified ? (
                <button
                  onClick={() => handleUnverifyPhone(user._id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Unverify Phone
                </button>
              ) : (
                <button
                  onClick={() => handleVerifyPhone(user._id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Verify Phone
                </button>
              )
            )}
          </div>
          <span className="text-xs text-gray-400">
            Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
          </span>
        </div>
      </div>
    </div>
  );

  const BookingCard = ({ booking, onEdit, selected, onSelect }: any) => {
    const status = (booking.status || "").toLowerCase();
    return (
      <div className={`bg-white rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
        selected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
      }`}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">{booking.parkingSpace?.title || "Unknown Space"}</h3>
              <p className="text-sm text-gray-500">{booking.user?.name || "Unknown User"}</p>
            </div>
            <input
              type="checkbox"
              checked={!!selected}
              onChange={onSelect}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date & Time:</span>
              <span className="font-medium">
                {booking.startTime ? new Date(booking.startTime).toLocaleString() : "N/A"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Amount:</span>
              <span className="font-medium text-green-600">${booking.totalPrice || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status:</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                status === "confirmed" ? "bg-green-100 text-green-800" :
                status === "pending" ? "bg-yellow-100 text-yellow-800" :
                status === "cancelled" ? "bg-red-100 text-red-800" :
                "bg-gray-100 text-gray-800"
              }`}>
                {booking.status}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Location:</span>
              <span className="font-medium">{booking.parkingSpace?.address?.city || "No location"}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => onEdit(booking)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Edit Booking
            </button>
            <span className="text-xs text-gray-400">
              {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "N/A"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const SpaceCard = ({ space, onEdit, selected, onSelect }: any) => {
    const status = (space.status || "").toLowerCase();
    return (
      <div className={`bg-white rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
        selected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
      }`}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">{space.title || "Untitled Space"}</h3>
              <p className="text-sm text-gray-500">{space.owner?.name || "Unknown Owner"}</p>
            </div>
            <input
              type="checkbox"
              checked={!!selected}
              onChange={onSelect}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Price/Hour:</span>
              <span className="font-medium text-green-600">${space.pricePerHour || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status:</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                status === "active" ? "bg-green-100 text-green-800" :
                status === "pending" ? "bg-yellow-100 text-yellow-800" :
                "bg-red-100 text-red-800"
              }`}>
                {space.status}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Location:</span>
              <span className="font-medium text-right">
                {space.address?.city || "No city"}
                {space.address?.state && `, ${space.address.state}`}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {space.description || "No description available"}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => onEdit(space)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Edit Space
            </button>
            <span className="text-xs text-gray-400">
              {space.createdAt ? new Date(space.createdAt).toLocaleDateString() : "N/A"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const GridView = ({ data, cardComponent, selectedItems, toggleSelection, onEdit, emptyMessage }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
      {data.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg font-medium">{emptyMessage}</p>
        </div>
      ) : (
        data.map((item: any) => React.createElement(cardComponent, {
          key: item._id,
          [cardComponent === UserCard ? "user" :
           cardComponent === BookingCard ? "booking" : "space"]: item,
          onEdit,
          selected: selectedItems.includes(item._id),
          onSelect: () => toggleSelection(item._id)
        }))
      )}
    </div>
  );

  const generateRecentActivity = () => {
    const activities: any[] = [];
    const recentUsers = users.slice(-3).reverse();
    recentUsers.forEach((user, index) => {
      activities.push({
        type: "user",
        message: `New user ${user?.name || "Unknown"} registered`,
        time: `${(index + 1) * 2} minutes ago`,
        color: "blue",
        user: user.name || "Unknown",
      });
    });

    const recentBookings = bookings.slice(-2).reverse();
    recentBookings.forEach((booking, index) => {
      activities.push({
        type: "booking",
        message: `${booking.user?.name || "User"} booked ${booking.parkingSpace?.title || "parking space"}`,
        time: `${(index + 5) * 2} minutes ago`,
        color: "green",
        amount: booking.totalPrice,
      });
    });

    const completedBookings = bookings
      .filter((b) => (b.status || "").toLowerCase() === "completed")
      .slice(-1);
    completedBookings.forEach((booking, index) => {
      activities.push({
        type: "payment",
        message: `Payment of $${booking.totalPrice || 0} received`,
        time: `${(index + 8) * 3} minutes ago`,
        color: "purple",
        amount: booking.totalPrice,
      });
    });

    return activities.slice(0, 4);
  };

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" /></svg>), gradient: "from-blue-500 to-purple-600" },
    { id: "users", label: "Users", icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>), gradient: "from-emerald-500 to-teal-600" },
    { id: "captains", label: "Captains", icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>), gradient: "from-indigo-500 to-blue-600" },
    { id: "bookings", label: "Bookings", icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>), gradient: "from-orange-500 to-red-600" },
    { id: "parkingspaces", label: "Parking Spaces", icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>), gradient: "from-purple-500 to-pink-600" },
    { id: "notification", label: "Notification", icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C8.67 6.165 8 7.388 8 9v5.159c0 .538-.214 1.055-.595 1.436L6 17h5m4 0v1a3 3 0 11-6 0v-1h6z" /></svg>), gradient: "from-yellow-500 to-orange-600" },
  ];

  const StatCard = ({ title, value, icon, gradient, change }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className="text-sm text-green-600 font-medium mt-1">
              ↑ {change}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-sm`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const DashboardContent = () => {
    const recentActivity = generateRecentActivity();
    const calculateGrowth = (current: number, type: string) => {
      const baseGrowth: Record<string, number> = {
        users: Math.floor(Math.random() * 15) + 5,
        captains: Math.floor(Math.random() * 10) + 3,
        bookings: Math.floor(Math.random() * 20) + 8,
        spaces: Math.floor(Math.random() * 10) + 3,
        revenue: Math.floor(Math.random() * 25) + 10,
      };
      return baseGrowth[type] || 5;
    };

    return (
      <div className="space-y-8">
        {/* Hero banner */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl shadow-lg p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome back, Admin</h1>
          <p className="text-blue-100 text-lg mb-6">
            Here's what's happening with your parking platform today.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Revenue", value: `$${dashboardStats.revenue.toLocaleString()}` },
              { label: "Active Now", value: dashboardStats.activeBookings },
              { label: "This Month", value: dashboardStats.totalBookings },
              { label: "Total Users", value: dashboardStats.totalUsers },
            ].map((stat, index) => (
              <div key={index} className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-blue-100 text-sm">{stat.label}</div>
                <div className="text-xl font-bold text-white">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <StatCard
            title="Total Users"
            value={dashboardStats.totalUsers}
            change={calculateGrowth(dashboardStats.totalUsers, "users")}
            gradient="from-blue-500 to-purple-600"
            icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1z" /></svg>}
          />
          <StatCard
            title="Total Captains"
            value={dashboardStats.totalCaptains}
            change={calculateGrowth(dashboardStats.totalCaptains, "captains")}
            gradient="from-indigo-500 to-blue-600"
            icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          />
          <StatCard
            title="Total Bookings"
            value={dashboardStats.totalBookings}
            change={calculateGrowth(dashboardStats.totalBookings, "bookings")}
            gradient="from-emerald-500 to-teal-600"
            icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          />
          <StatCard
            title="Parking Spaces"
            value={dashboardStats.totalSpaces}
            change={calculateGrowth(dashboardStats.totalSpaces, "spaces")}
            gradient="from-orange-500 to-red-600"
            icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>}
          />
          <StatCard
            title="Revenue"
            value={`$${dashboardStats.revenue.toLocaleString()}`}
            change={calculateGrowth(dashboardStats.revenue, "revenue")}
            gradient="from-purple-500 to-pink-600"
            icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1" /></svg>}
          />
        </div>

        {/* Recent activity + Quick stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        activity.color === "blue" ? "bg-blue-100" :
                        activity.color === "green" ? "bg-green-100" :
                        activity.color === "purple" ? "bg-purple-100" : "bg-orange-100"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          activity.color === "blue" ? "bg-blue-500" :
                          activity.color === "green" ? "bg-green-500" :
                          activity.color === "purple" ? "bg-purple-500" : "bg-orange-500"
                        }`}
                      ></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                    {activity.amount && (
                      <div className="text-sm font-medium text-green-600">${activity.amount}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Stats</h3>
            <div className="space-y-6">
              {[
                {
                  label: "Active Bookings",
                  value: dashboardStats.activeBookings,
                  total: Math.max(dashboardStats.totalBookings, 1),
                  color: "bg-blue-500",
                },
                {
                  label: "Occupied Spaces",
                  value: Math.floor(dashboardStats.totalSpaces * 0.75),
                  total: Math.max(dashboardStats.totalSpaces, 1),
                  color: "bg-green-500",
                },
                {
                  label: "Verified Users",
                  value: Math.floor(dashboardStats.totalUsers * 0.85),
                  total: Math.max(dashboardStats.totalUsers, 1),
                  color: "bg-orange-500",
                },
              ].map((stat, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{stat.label}</span>
                    <span className="text-gray-500">
                      {stat.value}/{stat.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${stat.color}`}
                      style={{
                        width: `${Math.min((stat.value / stat.total) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // -------------------------
  // Modals (User, Booking, Space)
  // -------------------------
  const UserEditModal = ({ user, onClose, onSave }: any) => {
    const [formData, setFormData] = useState<any>(user || {});
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
      setFormData(user || {});
      setHasChanges(false);
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
      setHasChanges(true);
    };

    const handleDropdownChange = (field: string, value: any) => {
      setFormData({ ...formData, [field]: value });
      setHasChanges(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!hasChanges) {
        alert("No changes to save");
        return;
      }
      try {
        await api.put(`/admin/users/${user._id}`, formData);
        alert("User updated successfully");
        onSave();
        onClose();
      } catch (err) {
        console.error("Error updating user:", err);
        alert("Failed to update user");
      }
    };

    const handleDelete = async () => {
      if (window.confirm("Are you sure you want to delete this user?")) {
        try {
          await api.delete(`/admin/users/${user._id}`);
          alert("User deleted successfully");
          onSave();
          onClose();
        } catch (err) {
          console.error("Error deleting user:", err);
          alert("Failed to delete user");
        }
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Edit User</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  placeholder="Name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  placeholder="Email"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Verified</label>
                <select
                  value={formData.phoneVerified ? "true" : "false"}
                  onChange={(e) => handleDropdownChange("phoneVerified", e.target.value === "true")}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="true">Verified</option>
                  <option value="false">Not Verified</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Verification</label>
                <select
                  value={formData.isVerified ? "true" : "false"}
                  onChange={(e) => handleDropdownChange("isVerified", e.target.value === "true")}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="true">Verified</option>
                  <option value="false">Not Verified</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">KYC Status</label>
                <select
                  value={formData.kycStatus || "pending"}
                  onChange={(e) => handleDropdownChange("kycStatus", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending KYC</option>
                  <option value="submitted">Submitted KYC</option>
                  <option value="approved">Approved KYC</option>
                  <option value="rejected">Rejected KYC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Is Captain</label>
                <select
                  value={formData.isCaptain ? "true" : "false"}
                  onChange={(e) => handleDropdownChange("isCaptain", e.target.value === "true")}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                <input
                  name="region"
                  value={formData.region || ""}
                  onChange={handleChange}
                  placeholder="Region"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Captain Areas (comma separated)
              </label>
              <input
                name="captainAreas"
                value={Array.isArray(formData.captainAreas) ? formData.captainAreas.join(", ") : (formData.captainAreas || "")}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    captainAreas: e.target.value
                      .split(",")
                      .map((a: string) => a.trim())
                      .filter((a: string) => a),
                  });
                  setHasChanges(true);
                }}
                placeholder="Area1, Area2"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                type="submit"
                disabled={!hasChanges}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                  hasChanges
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete User
              </button>
            </div>
          </form>

          <div className="p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full bg-gray-300 text-gray-800 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const BookingEditModal = ({ booking, onClose, onSave }: any) => {
    const [formData, setFormData] = useState<any>(booking || {});
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
      setFormData(booking || {});
      setHasChanges(false);
    }, [booking]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
      setHasChanges(true);
    };

    const handleDropdownChange = (field: string, value: any) => {
      setFormData({ ...formData, [field]: value });
      setHasChanges(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!hasChanges) {
        alert("No changes to save");
        return;
      }
      try {
        await api.put(`/admin/bookings/${booking._id}`, formData);
        alert("Booking updated successfully");
        onSave();
        onClose();
      } catch (err) {
        console.error("Error updating booking:", err);
        alert("Failed to update booking");
      }
    };

    const handleDelete = async () => {
      if (window.confirm("Are you sure you want to delete this booking?")) {
        try {
          await api.delete(`/admin/bookings/${booking._id}`);
          alert("Booking deleted successfully");
          onSave();
          onClose();
        } catch (err) {
          console.error("Error deleting booking:", err);
          alert("Failed to delete booking");
        }
      }
    };

    // Helper to convert ISO-ish to datetime-local safely (fallbacks added)
    const toDateTimeLocal = (val: any) => {
      if (!val) return "";
      try {
        const dt = new Date(val);
        if (isNaN(dt.getTime())) return "";
        // produce local YYYY-MM-DDTHH:mm
        const offset = dt.getTimezoneOffset();
        const local = new Date(dt.getTime() - (offset * 60000));
        return local.toISOString().slice(0, 16);
      } catch {
        return "";
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Edit Booking</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input
                  name="startTime"
                  type="datetime-local"
                  value={toDateTimeLocal(formData.startTime)}
                  onChange={(e) => {
                    setFormData({ ...formData, startTime: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                <input
                  name="endTime"
                  type="datetime-local"
                  value={toDateTimeLocal(formData.endTime)}
                  onChange={(e) => {
                    setFormData({ ...formData, endTime: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Price</label>
                <input
                  name="totalPrice"
                  type="number"
                  value={formData.totalPrice || ""}
                  onChange={handleChange}
                  placeholder="Total Price"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status || "pending"}
                  onChange={(e) => handleDropdownChange("status", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                type="submit"
                disabled={!hasChanges}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                  hasChanges
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete Booking
              </button>
            </div>
          </form>

          <div className="p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full bg-gray-300 text-gray-800 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SpaceEditModal = ({ space, onClose, onSave }: any) => {
    const [formData, setFormData] = useState<any>(space || {});
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
      setFormData(space || {});
      setHasChanges(false);
    }, [space]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
      setHasChanges(true);
    };

    const handleDropdownChange = (field: string, value: any) => {
      setFormData({ ...formData, [field]: value });
      setHasChanges(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!hasChanges) {
        alert("No changes to save");
        return;
      }
      try {
        await api.put(`/admin/parkingspaces/${space._id}`, formData);
        alert("Parking space updated successfully");
        onSave();
        onClose();
      } catch (err) {
        console.error("Error updating parking space:", err);
        alert("Failed to update parking space");
      }
    };

    const handleDelete = async () => {
      if (window.confirm("Are you sure you want to delete this parking space?")) {
        try {
          await api.delete(`/admin/parkingspaces/${space._id}`);
          alert("Parking space deleted successfully");
          onSave();
          onClose();
        } catch (err) {
          console.error("Error deleting parking space:", err);
          alert("Failed to delete parking space");
        }
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Edit Parking Space</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  name="title"
                  value={formData.title || ""}
                  onChange={handleChange}
                  placeholder="Title"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  name="description"
                  value={formData.description || ""}
                  onChange={handleChange}
                  placeholder="Description"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price per Hour</label>
                <input
                  name="pricePerHour"
                  type="number"
                  value={formData.pricePerHour || ""}
                  onChange={handleChange}
                  placeholder="Price per Hour"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status || "pending"}
                  onChange={(e) => handleDropdownChange("status", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                type="submit"
                disabled={!hasChanges}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                  hasChanges
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete Space
              </button>
            </div>
          </form>

          <div className="p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full bg-gray-300 text-gray-800 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // -------------------------
  // renderContent
  // -------------------------
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
            </div>
            <p className="mt-4 text-gray-600">Loading data...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
          <div className="flex">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      );
    }

    switch (tab) {
      case "dashboard":
        return <DashboardContent />;

      case "users": {
        const uniqueStates = [...new Set(users.map((u: any) => u.kycData?.state || "").filter(Boolean))].sort();
        const uniqueCities = [...new Set(users.map((u: any) => u.kycData?.city || "").filter(Boolean))].sort();
        const filteredUsers = getFilteredUsers();

        return (
          <div className="space-y-6">
            {/* Header with Search and Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Users Management</h2>
                <p className="text-gray-600">{filteredUsers.length} users found</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search users..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg ${
                      viewMode === "grid" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg ${
                      viewMode === "list" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex flex-wrap gap-4">
                <select
                  value={isVerifiedFilter === null ? "" : isVerifiedFilter ? "true" : "false"}
                  onChange={(e) => setIsVerifiedFilter(e.target.value === "" ? null : e.target.value === "true")}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Email Verification</option>
                  <option value="true">Verified</option>
                  <option value="false">Not Verified</option>
                </select>
                <select
                  value={kycStatusFilter ?? ""}
                  onChange={(e) => setKycStatusFilter(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All KYC Status</option>
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select
                  value={stateFilter ?? ""}
                  onChange={(e) => setStateFilter(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All States</option>
                  {uniqueStates.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <select
                  value={cityFilter ?? ""}
                  onChange={(e) => setCityFilter(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Cities</option>
                  {uniqueCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-blue-800 font-medium">
                    {selectedUsers.length} user(s) selected
                  </span>
                  <button
                    onClick={handleBulkDeleteUsers}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Delete Selected
                  </button>
                </div>
              </div>
            )}

            {/* Users Grid */}
            <GridView
              data={filteredUsers.filter(user =>
                (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.phone || "").includes(searchTerm)
              )}
              cardComponent={UserCard}
              selectedItems={selectedUsers}
              toggleSelection={toggleUserSelection}
              onEdit={(item: any) => setSelectedUser(item)}
              emptyMessage="No users found matching your criteria"
            />
          </div>
        );
      }

      case "captains": {
        const uniqueCaptainStates = [...new Set(users.map((u: any) => u.kycData?.state || "").filter(Boolean))].sort();
        const uniqueCaptainCities = [...new Set(users.map((u: any) => u.kycData?.city || "").filter(Boolean))].sort();
        const uniqueRegions = [...new Set(users.map((u: any) => u.region || "").filter(Boolean))].sort();
        const filteredCaptains = getFilteredCaptains();

        return (
          <div className="space-y-6">
            {/* Header with Search and Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Captain Management</h2>
                <p className="text-gray-600">{filteredCaptains.length} captains found</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search captains..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg ${
                      viewMode === "grid" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg ${
                      viewMode === "list" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex flex-wrap gap-4">
                <select
                  value={captainIsVerifiedFilter === null ? "" : captainIsVerifiedFilter ? "true" : "false"}
                  onChange={(e) => setCaptainIsVerifiedFilter(e.target.value === "" ? null : e.target.value === "true")}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Email Verification</option>
                  <option value="true">Verified</option>
                  <option value="false">Not Verified</option>
                </select>
                <select
                  value={captainKycStatusFilter ?? ""}
                  onChange={(e) => setCaptainKycStatusFilter(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All KYC Status</option>
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select
                  value={captainStateFilter ?? ""}
                  onChange={(e) => setCaptainStateFilter(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All States</option>
                  {uniqueCaptainStates.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <select
                  value={captainCityFilter ?? ""}
                  onChange={(e) => setCaptainCityFilter(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Cities</option>
                  {uniqueCaptainCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <select
                  value={regionFilter ?? ""}
                  onChange={(e) => setRegionFilter(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Regions</option>
                  {uniqueRegions.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
                <select
                  value={isCaptainFilter === null ? "" : isCaptainFilter ? "true" : "false"}
                  onChange={(e) => setIsCaptainFilter(e.target.value === "" ? null : e.target.value === "true")}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Captain Status</option>
                  <option value="true">Captains Only</option>
                  <option value="false">Non-Captains Only</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedCaptains.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-blue-800 font-medium">
                    {selectedCaptains.length} captain(s) selected
                  </span>
                  <button
                    onClick={handleBulkDeleteCaptains}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Delete Selected
                  </button>
                </div>
              </div>
            )}

            {/* Captains Grid */}
            <GridView
              data={filteredCaptains.filter(user =>
                (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.region || "").toLowerCase().includes(searchTerm.toLowerCase())
              )}
              cardComponent={UserCard}
              selectedItems={selectedCaptains}
              toggleSelection={toggleCaptainSelection}
              onEdit={(item: any) => setSelectedUser(item)}
              emptyMessage="No captains found matching your criteria"
            />
          </div>
        );
      }

      case "bookings": {
        const uniqueBookingStatuses = [...new Set(bookings.map((b: any) => b.status).filter(Boolean))].sort();
        const uniqueBookingCities = [...new Set(bookings.map((b: any) => b.parkingSpace?.address?.city || "").filter(Boolean))].sort();
        const filteredBookings = getFilteredBookings();

        return (
          <div className="space-y-6">
            {/* Header with Search and Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Bookings Management</h2>
                <p className="text-gray-600">{filteredBookings.length} bookings found</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search bookings..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg ${
                      viewMode === "grid" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg ${
                      viewMode === "list" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex flex-wrap gap-4">
                <select
                  value={bookingStatusFilter ?? ""}
                  onChange={(e) => setBookingStatusFilter(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  {uniqueBookingStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <select
                  value={bookingCityFilter ?? ""}
                  onChange={(e) => setBookingCityFilter(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Cities</option>
                  {uniqueBookingCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedBookings.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-blue-800 font-medium">
                    {selectedBookings.length} booking(s) selected
                  </span>
                  <button
                    onClick={handleBulkDeleteBookings}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Delete Selected
                  </button>
                </div>
              </div>
            )}

            {/* Bookings Grid */}
            <GridView
              data={filteredBookings.filter(booking =>
                (booking.user?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (booking.parkingSpace?.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (booking.parkingSpace?.address?.city || "").toLowerCase().includes(searchTerm.toLowerCase())
              )}
              cardComponent={BookingCard}
              selectedItems={selectedBookings}
              toggleSelection={toggleBookingSelection}
              onEdit={(item: any) => setSelectedBooking(item)}
              emptyMessage="No bookings found matching your criteria"
            />
          </div>
        );
      }

      case "parkingspaces": {
        const uniqueSpaceStatuses = [...new Set(spaces.map((s: any) => s.status).filter(Boolean))].sort();
        const uniqueSpaceStates = [...new Set(spaces.map((s: any) => s.address?.state || "").filter(Boolean))].sort();
        const uniqueSpaceCities = [...new Set(spaces.map((s: any) => s.address?.city || "").filter(Boolean))].sort();
        const filteredSpaces = getFilteredSpaces();

        return (
          <div className="space-y-6">
            {/* Header with Search and Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Parking Spaces Management</h2>
                <p className="text-gray-600">{filteredSpaces.length} spaces found</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search spaces..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg ${
                      viewMode === "grid" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg ${
                      viewMode === "list" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex flex-wrap gap-4">
                <select
                  value={spaceStatusFilter ?? ""}
                  onChange={(e) => setSpaceStatusFilter(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  {uniqueSpaceStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <select
                  value={spaceStateFilter ?? ""}
                  onChange={(e) => setSpaceStateFilter(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All States</option>
                  {uniqueSpaceStates.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <select
                  value={spaceCityFilter ?? ""}
                  onChange={(e) => setSpaceCityFilter(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Cities</option>
                  {uniqueSpaceCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedSpaces.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-blue-800 font-medium">
                    {selectedSpaces.length} space(s) selected
                  </span>
                  <button
                    onClick={handleBulkDeleteSpaces}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Delete Selected
                  </button>
                </div>
              </div>
            )}

            {/* Spaces Grid */}
            <GridView
              data={filteredSpaces.filter(space =>
                (space.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (space.owner?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (space.address?.city || "").toLowerCase().includes(searchTerm.toLowerCase())
              )}
              cardComponent={SpaceCard}
              selectedItems={selectedSpaces}
              toggleSelection={toggleSpaceSelection}
              onEdit={(item: any) => setSelectedSpace(item)}
              emptyMessage="No parking spaces found matching your criteria"
            />
          </div>
        );
      }

      case "notification":
        return <Notification />;

      default:
        return <DashboardContent />;
    }
  };

  // -------------------------
  // Layout return
  // -------------------------
  return (
    <div className="flex min-h-screen bg-gray-50" style={{ zoom: "90%" }}>
      {/* Sidebar */}
      <div
        className={`${
          sidebarCollapsed ? "w-20" : "w-64"
        } transition-all duration-300 ease-in-out bg-white shadow-lg border-r border-gray-200`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                </svg>
              </div>
              {!sidebarCollapsed && (
                <div className="ml-3">
                  <h2 className="text-lg font-bold text-gray-900">ParkAdmin</h2>
                  <p className="text-sm text-gray-500">Control Panel</p>
                </div>
              )}
            </div>
          </div>
          <nav className="flex-1 px-4 py-6">
            <div className="space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 ${
                    tab === item.id
                      ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg`
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className={tab === item.id ? "text-white" : "text-gray-400"}>{item.icon}</span>
                  {!sidebarCollapsed && <span className="ml-3 font-medium">{item.label}</span>}
                </button>
              ))}
            </div>
          </nav>
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              <svg
                className={`w-5 h-5 transform transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M21 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 p-6">
        <div className="mb-6">{renderContent()}</div>

        {/* Modals */}
        {selectedUser && (
          <UserEditModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onSave={() => {
              fetchUsers();
            }}
          />
        )}

        {selectedBooking && (
          <BookingEditModal
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onSave={() => {
              fetchBookings();
            }}
          />
        )}

        {selectedSpace && (
          <SpaceEditModal
            space={selectedSpace}
            onClose={() => setSelectedSpace(null)}
            onSave={() => {
              fetchSpaces();
            }}
          />
        )}
      </div>
    </div>
  );
}
