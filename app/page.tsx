"use client"

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { StarIcon, CurrencyDollarIcon, UserGroupIcon } from '@heroicons/react/24/solid'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '@/lib/firebase'
import { collection, query, getDocs, orderBy, limit, where, doc, getDoc } from 'firebase/firestore'
import Link from 'next/link'
import { format, startOfDay, endOfDay, subDays } from 'date-fns'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRightLeft, Eye, Settings, Menu, Utensils, MonitorPlay, TableProperties } from 'lucide-react'
import { DateRange } from "react-day-picker"

const COLORS = ['#2c3e50', '#34495e', '#7f8c8d', '#95a5a6']

interface SalesDataItem {
  hour: string;
  sales: number;
}

interface FeedbackDataItem {
  name: string;
  value: number;
}

interface OrderTimeDataItem {
  time: string;
  orders: number;
}

interface PopularMenuItem {
  name: string;
  orders: number;
}

export default function AdminDashboard() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  const [salesData, setSalesData] = useState<SalesDataItem[]>([
    { hour: '00:00', sales: 120 },
    { hour: '01:00', sales: 80 },
    // ... add more hourly data
  ]);
  const [feedbackData, setFeedbackData] = useState<FeedbackDataItem[]>([]);
  const [orderTimeData, setOrderTimeData] = useState<OrderTimeDataItem[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [popularMenuItems, setPopularMenuItems] = useState<PopularMenuItem[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });
  const [biggestOrder, setBiggestOrder] = useState(0);
  const [smallestOrder, setSmallestOrder] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [fiveStarReviews, setFiveStarReviews] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [restaurantInfo, setRestaurantInfo] = useState({ logo: null });

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(!isSidebarOpen)
  }, [isSidebarOpen])

  const fetchSalesData = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    const ordersRef = collection(db, 'orders');
    const startDate = startOfDay(dateRange.from);
    const endDate = endOfDay(dateRange.to);
    
    const q = query(
      ordersRef,
      where('placedAt', '>=', startDate),
      where('placedAt', '<=', endDate),
      orderBy('placedAt', 'desc'),
      limit(7)
    );
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({
      hour: new Date(doc.data().placedAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sales: doc.data().total
    }));
    setSalesData(data.reverse());
  }, [dateRange]);

  const fetchFeedbackData = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    const ordersRef = collection(db, 'orders');
    const startDate = startOfDay(dateRange.from);
    const endDate = endOfDay(dateRange.to);
    
    const q = query(
      ordersRef,
      where('placedAt', '>=', startDate),
      where('placedAt', '<=', endDate)
    );
    const querySnapshot = await getDocs(q);
    const data = [1, 2, 3, 4, 5].map(rating => ({
      name: `${rating} Star${rating > 1 ? 's' : ''}`,
      value: querySnapshot.docs.filter(doc => doc.data().rating === rating).length
    }));
    setFeedbackData(data);
  }, [dateRange]);

  const fetchOrderTimeData = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    const orderRef = collection(db, 'orders');
    const startDate = startOfDay(dateRange.from);
    const endDate = endOfDay(dateRange.to);
    
    const q = query(
      orderRef,
      where('placedAt', '>=', startDate),
      where('placedAt', '<=', endDate),
      orderBy('placedAt', 'desc'),
      limit(24)
    );
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.reduce((acc, doc) => {
      const hour = new Date(doc.data().placedAt.toDate()).getHours();
      const time = `${hour % 12 || 12}${hour >= 12 ? 'pm' : 'am'}`;
      acc[time] = (acc[time] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    setOrderTimeData(Object.entries(data).map(([time, orders]) => ({ time, orders })));
  }, [dateRange]);

  const fetchDashboardData = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    const ordersRef = collection(db, 'orders');
    const startDate = startOfDay(dateRange.from);
    const endDate = endOfDay(dateRange.to);
    
    const q = query(
      ordersRef,
      where('placedAt', '>=', startDate),
      where('placedAt', '<=', endDate)
    );
    const ordersSnapshot = await getDocs(q);
    
    let revenue = 0;
    let totalRating = 0;
    let ratingCount = 0;
    const menuItemCounts: Record<string, number> = {};
    let maxOrder = 0;
    let minOrder = 0;
    let totalReviews = 0;
    let fiveStarReviews = 0;

    ordersSnapshot.forEach(doc => {
      const data = doc.data();
      revenue += data.total;
      if (data.rating) {
        totalRating += data.rating;
        ratingCount++;
        totalReviews++;
        if (data.rating === 5) {
          fiveStarReviews++;
        }
      }
      data.items.forEach((item: { name: string }) => {
        menuItemCounts[item.name] = (menuItemCounts[item.name] || 0) + 1;
      });
      if (data.total > maxOrder) {
        maxOrder = data.total;
      }
      if (data.total < minOrder) {
        minOrder = data.total;
      }
    });

    setTotalRevenue(revenue);
    setTotalCustomers(ordersSnapshot.size);
    setAvgRating(totalRating / ratingCount);
    setPopularMenuItems(Object.entries(menuItemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, orders: count })));
    setBiggestOrder(maxOrder);
    setSmallestOrder(minOrder);
    setTotalReviews(totalReviews);
    setFiveStarReviews(fiveStarReviews);
  }, [dateRange]);

  const fetchRestaurantInfo = useCallback(async () => {
    try {
      const restaurantRef = doc(db, 'restaurantInfo', 'main');
      const restaurantSnap = await getDoc(restaurantRef);
      if (restaurantSnap.exists()) {
        const data = restaurantSnap.data();
        if (data && 'logo' in data) {
          setRestaurantInfo(data as { logo: null });
        } else {
          console.error('Restaurant data is missing the logo field');
        }
      }
    } catch (error) {
      console.error('Error fetching restaurant info:', error);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && dateRange?.from && dateRange?.to) {
      fetchSalesData();
      fetchFeedbackData();
      fetchOrderTimeData();
      fetchDashboardData();
    }
  }, [user, dateRange, fetchSalesData, fetchFeedbackData, fetchOrderTimeData, fetchDashboardData]);

  useEffect(() => {
    if (user) {
      fetchRestaurantInfo();
    }
  }, [user, fetchRestaurantInfo]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-card w-64 h-screen shadow-lg fixed left-0 top-0 z-30 overflow-y-auto"
          >
            <div className="p-4">
              <div className="flex items-center mb-6">
                <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2">
                  <X size={20} />
                </Button>
                <h2 className="text-xl font-semibold">Admin Dashboard</h2>
              </div>
              <nav>
                <ul className="space-y-4">
                  <li>
                    <Button asChild variant="ghost" className="w-full justify-start">
                      <Link href="/menu">
                        <Utensils size={20} className="mr-2" />
                        Menu Management
                      </Link>
                    </Button>
                  </li>
                  <li>
                    <Button asChild variant="ghost" className="w-full justify-start">
                      <Link href="/kds">
                        <MonitorPlay size={20} className="mr-2" />
                        Kitchen Display System
                      </Link>
                    </Button>
                  </li>
                  <li>
                    <Button asChild variant="ghost" className="w-full justify-start">
                      <Link href="/tablemanagement">
                        <TableProperties size={20} className="mr-2" />
                        Tables and QR Codes
                      </Link>
                    </Button>
                  </li>
                  <li>
                    <Button asChild variant="ghost" className="w-full justify-start">
                      <Link href="/menu/live">
                        <Eye size={20} className="mr-2" />
                        Live Menu
                      </Link>
                    </Button>
                  </li>
                  <li className="my-4 border-t border-border"></li>
                  <li>
                    <Button asChild variant="ghost" className="w-full justify-start">
                      <Link href="/settings">
                        <Settings size={20} className="mr-2" />
                        Settings
                      </Link>
                    </Button>
                  </li>
                </ul>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Button variant="outline" size="icon" onClick={toggleSidebar} className="mr-4">
                  <Menu size={24} />
                </Button>
                {restaurantInfo.logo ? (
                  <Image className="h-8 w-auto" src={restaurantInfo.logo} alt="Restaurant Logo" width={32} height={32} />
                ) : (
                  <Image className="h-8 w-auto" src="/logo.svg" alt="Restaurant Logo" width={32} height={32} />
                )}
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {/* You can add other navigation items here if needed */}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Popover
              trigger={
                <Button variant="outline">
                  {format(selectedDate, "LLL dd, y")}
                </Button>
              }
              content={
                <Calendar
                  selected={selectedDate}
                  onSelect={(date: Date) => {
                    setSelectedDate(date);
                    setDateRange({
                      from: date,
                      to: date,
                    });
                  }}
                />
              }
            />
          </div>
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CurrencyDollarIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                        <dd className="text-lg font-medium text-gray-900">${totalRevenue.toFixed(2)}</dd>
                        <dt className="text-xs font-medium text-gray-500 mt-2">Excluding Service Charge & GST</dt>
                        <dd className="text-sm font-medium text-gray-700">${(totalRevenue * 0.9).toFixed(2)}</dd>
                        <dt className="text-xs font-medium text-gray-500 mt-1">Service Charge & GST</dt>
                        <dd className="text-sm font-medium text-gray-700">${(totalRevenue * 0.1).toFixed(2)}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <UserGroupIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                        <dd className="text-lg font-medium text-gray-900">{totalCustomers}</dd>
                        <dt className="text-xs font-medium text-gray-500 mt-2">Biggest Order</dt>
                        <dd className="text-sm font-medium text-gray-700">${biggestOrder.toFixed(2)}</dd>
                        <dt className="text-xs font-medium text-gray-500 mt-1">Smallest Order</dt>
                        <dd className="text-sm font-medium text-gray-700">${smallestOrder.toFixed(2)}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <StarIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Avg. Rating</dt>
                        <dd className="text-lg font-medium text-gray-900">{avgRating.toFixed(1)}</dd>
                        <dt className="text-xs font-medium text-gray-500 mt-2">Total Reviews</dt>
                        <dd className="text-sm font-medium text-gray-700">{totalReviews}</dd>
                        <dt className="text-xs font-medium text-gray-500 mt-1">5-Star Reviews</dt>
                        <dd className="text-sm font-medium text-gray-700">{fiveStarReviews}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Daily Sales</h3>
                  <div className="mt-2 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="sales" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Customer Feedback</h3>
                  <div className="mt-2 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={feedbackData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {feedbackData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Order Times</h3>
                  <div className="mt-2 h-64">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={orderTimeData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="time" angle={-45} textAnchor="end" height={60} />
                        <YAxis axisLine={false} tickFormatter={(value: number) => Math.floor(value).toString()} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="orders" stroke="#8884d8" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5 h-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Top 3 Menu Items</h3>
                  <div className="space-y-4">
                    {popularMenuItems.slice(0, 3).map((item, index) => (
                      <div key={item.name} className="flex items-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl ${
                          index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="ml-4 flex-grow">
                          <p className="text-lg font-medium text-gray-900">{item.name}</p>
                          <p className="text-base text-gray-500">{item.orders} orders</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Menu Management</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Manage your restaurant&apos;s menu items, categories, and pricing.</p>
                  </div>
                  <div className="mt-4">
                    <Link href="/menu" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Go to Menu Management
                    </Link>
                  </div>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Kitchen Display System</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">View and manage incoming orders in real-time.</p>
                  </div>
                  <div className="mt-4">
                    <Link href="/kds" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Go to KDS
                    </Link>
                  </div>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Table & QR Management</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Manage table layouts and generate QR codes for each table.</p>
                  </div>
                  <div className="mt-4">
                    <Link href="/tablemanagement" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Manage Tables & QR Codes
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}