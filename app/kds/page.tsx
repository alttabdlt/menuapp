"use client"

import { Order } from '../types/database'
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/Select1"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { db } from '../../lib/firebase'
import { collection, query, onSnapshot, doc, updateDoc, orderBy, where } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { AlertCircle, Coffee, Utensils, CheckCircle, Search, Filter, Clock, Check, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { ConfirmationDialog } from '../../components/ConfirmationDialog'
import { format, addDays, subDays } from 'date-fns'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { useMediaQuery } from 'react-responsive'
import Link from 'next/link'

export default function Component() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filterStatus, setFilterStatus] = useState<Order['status'] | 'All'>('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [itemToToggle, setItemToToggle] = useState<{ orderId: string, itemId: string, name: string, completed: boolean } | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1024px)' })

  useEffect(() => {
    const ordersRef = collection(db, 'orders')
    const startOfDay = new Date(selectedDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(selectedDate)
    endOfDay.setHours(23, 59, 59, 999)

    const q = query(
      ordersRef,
      where('placedAt', '>=', startOfDay),
      where('placedAt', '<=', endOfDay),
      orderBy('placedAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedOrders = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          ...data,
          id: doc.id,
          placedAt: data.placedAt.toDate(),
          items: data.items.map((item: any) => ({
            ...item,
            completed: item.completed || false
          }))
        } as Order
      })
      console.log('Fetched orders:', updatedOrders)
      setOrders(updatedOrders)
    })

    return () => unsubscribe()
  }, [selectedDate])

  const filteredOrders = orders
    .filter(order => filterStatus === 'All' || order.status === filterStatus)
    .filter(order => 
      searchTerm === '' ||
      (order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (order.tableNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    )
    .sort((a, b) => {
      const dateA = a.placedAt instanceof Date ? a.placedAt : a.placedAt.toDate();
      const dateB = b.placedAt instanceof Date ? b.placedAt : b.placedAt.toDate();
      return dateB.getTime() - dateA.getTime();
    })

  console.log('Filtered orders:', filteredOrders)

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const orderRef = doc(db, 'orders', orderId)
      await updateDoc(orderRef, { status: newStatus })
      toast.success(`Order status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    }
  }

  const showConfirmation = (orderId: string, itemId: string, itemName: string, completed: boolean) => {
    setItemToToggle({ orderId, itemId, name: itemName, completed })
    setConfirmationDialogOpen(true)
  }

  const toggleItemCompletion = async () => {
    if (!itemToToggle) return

    try {
      const { orderId, itemId } = itemToToggle
      const orderRef = doc(db, 'orders', orderId)
      const order = orders.find(o => o.id === orderId)
      if (!order) return

      const updatedItems = order.items.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )

      await updateDoc(orderRef, { items: updatedItems })
      toast.success('Item status updated')
      setConfirmationDialogOpen(false)
      setItemToToggle(null)
    } catch (error) {
      console.error('Error updating item completion:', error)
      toast.error('Failed to update item status')
    }
  }

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'Received': return <AlertCircle className="text-blue-500" />
      case 'Preparing': return <Coffee className="text-yellow-500" />
      case 'Ready to Serve': return <Utensils className="text-green-500" />
      case 'Served': return <CheckCircle className="text-gray-500" />
    }
  }

  const getTimeSinceOrder = (placedAt: Date | { toDate: () => Date }) => {
    const date = placedAt instanceof Date ? placedAt : placedAt.toDate();
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m`;
  }

  useEffect(() => {
    console.log('KDS component re-rendered')
  }, [orders, filterStatus, searchTerm])

  const handleStatusUpdate = (orderId: string, newStatus: Order['status']) => {
    updateOrderStatus(orderId, newStatus)
  }

  const handlePreviousDay = () => {
    setSelectedDate(prevDate => subDays(prevDate, 1))
  }

  const handleNextDay = () => {
    setSelectedDate(prevDate => addDays(prevDate, 1))
  }

  const toggleCalendar = () => {
    setIsCalendarOpen(!isCalendarOpen)
  }

  const handleDaySelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setIsCalendarOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Kitchen Display System</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Date picker */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" size="icon" onClick={handlePreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="relative">
            <Button variant="outline" onClick={toggleCalendar} className="w-[280px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, "PPP")}
            </Button>
            {isCalendarOpen && (
              <div className="absolute top-full mt-2 bg-white rounded-lg shadow-lg z-10">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDaySelect}
                  className="p-3"
                />
              </div>
            )}
          </div>
          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Search and filter */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-64"
            />
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="text-gray-400" />
            <Select
              value={filterStatus}
              onValueChange={(value) => setFilterStatus(value as Order['status'] | 'All')}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter orders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Orders</SelectItem>
                <SelectItem value="Received">Received</SelectItem>
                <SelectItem value="Preparing">Preparing</SelectItem>
                <SelectItem value="Ready to Serve">Ready to Serve</SelectItem>
                <SelectItem value="Served">Served</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Order grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredOrders.map(order => (
            <Card
              key={order.id}
              className={`${order.isRush ? 'border-2 border-red-500' : ''} 
                          ${order.status === 'Served' ? 'opacity-50' : ''}
                          ${isTabletOrMobile ? 'text-sm' : ''}`}
            >
              <CardHeader className="flex justify-between items-center pb-2">
                <CardTitle className="text-lg font-bold">Order #{order.orderNumber}</CardTitle>
                <span className="text-sm text-gray-500">
                  {order.orderType === 'dine-in' ? 'Dine-in' : 'Takeaway'}
                </span>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-2">
                  {getStatusIcon(order.status)}
                  <span className="ml-2 text-sm font-medium">{order.status}</span>
                  <Clock className="ml-auto text-gray-400" />
                  <span className="ml-1 text-sm text-gray-500">
                    {getTimeSinceOrder(order.placedAt)}
                  </span>
                </div>
                <ul className="space-y-2 mb-4">
                  {order.items.map(item => (
                    <li key={item.id} className="flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`w-6 h-6 rounded-full mr-2 p-0 ${item.completed ? 'bg-green-500' : 'border border-gray-300'}`}
                        onClick={() => showConfirmation(order.id, item.id, item.name, item.completed || false)}
                      >
                        {item.completed && <Check className="h-4 w-4 text-white" />}
                      </Button>
                      <span className={item.completed ? 'line-through' : ''}>
                        {item.quantity}x {item.name}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap justify-between mt-4 gap-2">
                  <Button
                    onClick={() => setSelectedOrder(order)}
                    variant="outline"
                    size="sm"
                    className="flex-grow"
                  >
                    Details
                  </Button>
                  {['Received', 'Preparing', 'Ready to Serve', 'Served'].map((status, index) => (
                    <Button
                      key={status}
                      onClick={() => handleStatusUpdate(order.id, status as Order['status'])}
                      disabled={
                        (index === 0 && order.status !== 'Received') ||
                        (index > 0 && order.status !== ['Received', 'Preparing', 'Ready to Serve', 'Served'][index - 1]) ||
                        order.status === 'Served' ||
                        (status === 'Served' && !order.items.every(item => item.completed))
                      }
                      variant={order.status === status ? "default" : "outline"}
                      size="sm"
                      className="flex-grow"
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Order Details: #{selectedOrder.orderNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <p>Status: {selectedOrder.status}</p>
              <p>Placed: {(selectedOrder.placedAt instanceof Date 
                ? selectedOrder.placedAt 
                : selectedOrder.placedAt.toDate()
              ).toLocaleTimeString()}</p>
              <p>Order Type: {selectedOrder.orderType === 'dine-in' ? 'Dine-in' : 'Takeaway'}</p>
              <h3 className="font-bold mt-4 mb-2">Items:</h3>
              <ul className="space-y-2">
                {selectedOrder.items.map(item => (
                  <li key={item.id} className="flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    {item.specialInstructions && (
                      <span className="text-sm text-gray-600">Note: {item.specialInstructions}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedOrder(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <ConfirmationDialog
        isOpen={confirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
        onConfirm={toggleItemCompletion}
        title="Confirm Item Status Change"
        message={`Are you sure you want to mark "${itemToToggle?.name}" as ${itemToToggle?.completed ? 'incomplete' : 'complete'}?`}
      />

      <Link href="/" passHref>
        <Button variant="outline" className="absolute top-4 right-4">
          Go to Admin
        </Button>
      </Link>
    </div>
  )
}
