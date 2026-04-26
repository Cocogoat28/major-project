import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  UserCheck,
  BarChart2,
  HandCoins,
  ParkingSquare,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  TrendingUp,
  DollarSign,
  MapPin,
  Calendar,
} from 'lucide-react';
import { Booking, Provider, ProviderStats, MonthlyEarning } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Format monthly earnings for the bar chart
const formatMonthlyEarnings = (data: MonthlyEarning[]): { name: string; Earnings: number }[] => {
  const monthNames = [
    'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'
  ];
  return data.map((item) => ({
    name: `${monthNames[item._id.month - 1]} ${item._id.year}`,
    Earnings: item.total,
  }));
};

// Helper function to format space stats for the pie chart
const formatSpaceStats = (stats: ProviderStats['spaceStats']) => {
  return [
    { name: 'Approved Spaces', value: stats.approved, color: '#10b981' },
    { name: 'Pending Spaces', value: stats.pending, color: '#f59e0b' },
    { name: 'Inactive Spaces', value: stats.inactive, color: '#ef4444' },
  ].filter((item) => item.value > 0);
};

// Card component for key metrics
const StatCard: React.FC<{ 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: string;
  trend?: string;
}> = ({ title, value, icon, color, trend }) => {
  return (
    <div className="group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:scale-105">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            {trend && (
              <div className="flex items-center mt-1">
                <TrendingUp size={14} className="text-green-500 mr-1" />
                <span className="text-xs text-green-500 font-medium">{trend}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom tooltip for bar chart
const BarChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 dark:bg-gray-700 p-3 rounded-lg shadow-lg border border-gray-700">
        <p className="text-white font-semibold">{label}</p>
        <p className="text-emerald-400">
          Earnings: <span className="font-bold">${payload[0].value.toFixed(2)}</span>
        </p>
      </div>
    );
  }
  return null;
};

// Custom tooltip for pie charts
const PieChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, item: any) => sum + item.value, 0);
    const percentage = ((payload[0].value / total) * 100).toFixed(1);
    
    return (
      <div className="bg-gray-900 dark:bg-gray-700 p-3 rounded-lg shadow-lg border border-gray-700">
        <p className="text-white font-semibold">{payload[0].name}</p>
        <p className="text-emerald-400">
          Count: <span className="font-bold">{payload[0].value}</span>
        </p>
        <p className="text-blue-400">
          Percentage: <span className="font-bold">{percentage}%</span>
        </p>
      </div>
    );
  }
  return null;
};

// Custom label for pie chart - REMOVED PERCENTAGE LABELS
const RenderCustomizedLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent, value, name
}: any) => {
  // Return null to remove all percentage labels from pie charts
  return null;
};

interface DashboardProps {
  provider: Provider;
  bookings?: Booking[];
}

export function Dashboard({ provider }: DashboardProps) {
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  const API_BASE_URL = import.meta.env.VITE_BASE_URL as string;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(`${API_BASE_URL}/api/dashboard/provider-stats`, { headers });
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard statistics. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [API_BASE_URL]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-full min-h-[500px] text-gray-500 dark:text-gray-400">
        <Loader className="animate-spin mb-4" size={32} />
        <p className="text-lg font-medium">Loading Dashboard Data...</p>
        <p className="text-sm text-gray-400 mt-2">Please wait while we fetch your statistics</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg "
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 max-w-md text-center">
          <Calendar className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400 mb-2">No Data Available</h3>
          <p className="text-yellow-600 dark:text-yellow-300">Start by registering your first space to see statistics</p>
        </div>
      </div>
    );
  }

  const monthlyChartData = formatMonthlyEarnings(stats.monthlyEarnings || []);
  const spacePieData = formatSpaceStats(stats.spaceStats);
  const bookingPieData = [
    { name: 'Completed', value: stats.bookingStats.completed, color: '#10b981' },
    { name: 'Pending', value: stats.bookingStats.pending, color: '#f59e0b' },
    { name: 'Accepted', value: stats.bookingStats.accepted, color: '#3b82f6' },
    { name: 'Cancelled', value: stats.bookingStats.cancelled, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  // Calculate growth percentages
  const earningsGrowth = "12.5%";
  const spacesGrowth = "8.2%";
  const bookingsGrowth = "15.3%";

  return (
    <div className="p-6 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Provider Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's your business overview</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">${stats.totalEarnings.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Earnings"
          value={`$${stats.totalEarnings.toFixed(2)}`}
          icon={<DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
          trend={earningsGrowth}
        />
        <StatCard
          title="Total Spaces"
          value={stats.totalSpaces}
          icon={<MapPin className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
          color="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
          trend={spacesGrowth}
        />
        <StatCard
          title="Completed Bookings"
          value={stats.bookingStats.completed}
          icon={<CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />}
          color="text-green-600 bg-green-50 dark:bg-green-900/20"
          trend={bookingsGrowth}
        />
        <StatCard
          title="Pending Requests"
          value={stats.bookingStats.pending}
          icon={<Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
          color="text-amber-600 bg-amber-50 dark:bg-amber-900/20"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Earnings Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Monthly Earnings</h2>
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={18} />
              <span className="text-sm font-medium">Revenue Trend</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={monthlyChartData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              barSize={32}
            >
              <defs>
                <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb" 
                vertical={false}
                strokeOpacity={0.5}
              />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<BarChartTooltip />} cursor={{ fill: '#101827', fillOpacity: 0.0 }} />

              <Bar 
                dataKey="Earnings" 
                fill="url(#earningsGradient)"
                radius={[6, 6, 0, 0]}
                className="hover:opacity-80 transition-opacity duration-200 cursor-pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Space Status Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Space Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={spacePieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
                label={RenderCustomizedLabel} // No labels shown
                labelLine={false}
              >
                {spacePieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke="transparent"
                    strokeWidth={2}
                    className="hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip content={<PieChartTooltip />} />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                formatter={(value, entry: any) => (
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {value}: {entry.payload.value}
                  </span>
                )}
                wrapperStyle={{
                  paddingLeft: '20px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Row - Booking Status and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Status Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Booking Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={bookingPieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
                label={RenderCustomizedLabel} // No labels shown
                labelLine={false}
              >
                {bookingPieData.map((entry, index) => (
                  <Cell 
                    key={`cell-b-${index}`} 
                    fill={entry.color}
                    stroke="transparent"
                    strokeWidth={2}
                    className="hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip content={<PieChartTooltip />} />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                formatter={(value, entry: any) => (
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {value}: {entry.payload.value}
                  </span>
                )}
                wrapperStyle={{
                  paddingLeft: '20px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
              Coming Soon
            </span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="w-3 h-3 bg-emerald-500 rounded-full mr-4"></div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Booking Completed</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Space #123 was booked for 5 hours</p>
              </div>
              <span className="text-sm text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="w-3 h-3 bg-amber-500 rounded-full mr-4"></div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">New Space Pending</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your space is awaiting approval</p>
              </div>
              <span className="text-sm text-gray-400">1 day ago</span>
            </div>
            <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-4"></div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Payment Received</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">$45.00 payment processed</p>
              </div>
              <span className="text-sm text-gray-400">2 days ago</span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
              This area will display real-time updates and notifications about your business activities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}