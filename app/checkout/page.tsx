'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Minus, Plus, ArrowLeft } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { log } from '../../context/CartContext'
import Link from 'next/link'
import React from 'react'
import { Button } from "../../components/ui/button"
import { Textarea } from "../../components/ui/Textarea"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../components/ui/card"
import { ScrollArea } from "../../components/ui/scroll-area"
import Image from 'next/image'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select1'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { RestaurantInfo } from '../types/database'
import { useMediaQuery } from 'react-responsive'

export default function CheckoutPage() {
  const { cart, updateQuantity, removeFromCart, calculateTotal } = useCart()
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [logo, setLogo] = useState<string | null>(null)
  const router = useRouter()
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>('dine-in')
  const [orderTypeEnabled, setOrderTypeEnabled] = useState(true)
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1024px)' })

  useEffect(() => {
    const fetchSettings = async () => {
      const restaurantRef = doc(db, 'restaurantInfo', 'main');
      const restaurantSnap = await getDoc(restaurantRef);
      if (restaurantSnap.exists()) {
        const data = restaurantSnap.data() as RestaurantInfo;
        setLogo(data.logo || null);
        setOrderTypeEnabled(data.orderTypeEnabled);
      }
    };

    fetchSettings();
  }, [])

  const handlePlaceOrder = () => {
    router.push(`/payment?orderType=${orderType}`)
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {logo && (
        <div className="flex justify-center mb-4">
          <Image
            src={logo}
            alt="Restaurant Logo"
            width={100}
            height={100}
            className="object-contain"
          />
        </div>
      )}
      <Card className="max-w-xl mx-auto">
        <CardHeader className="flex flex-col items-start space-y-2">
          <CardTitle className="text-2xl font-bold">Checkout</CardTitle>
          <Link href="/cart" passHref>
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cart
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[50vh] rounded-md border-2 border-gray-300 p-2">
            {cart.map((item) => (
              <div key={item.id} className="mb-4 bg-card p-3 rounded-md shadow-md border-2 border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 relative rounded-md overflow-hidden">
                      <Image
                        src={item.image || '/placeholder.svg'}
                        alt={item.name}
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        ${parseFloat(item.basePrice).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm px-2">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.selectedSize && (
                    <p>Size: {item.selectedSize.name} (+${parseFloat(item.selectedSize.price).toFixed(2)})</p>
                  )}
                  {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                    <div>
                      <p>Add-ons:</p>
                      <ul className="list-disc list-inside pl-2">
                        {item.selectedAddOns.map((addon, index) => (
                          <li key={index}>{addon.name} (+${parseFloat(addon.price).toFixed(2)})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {item.note && (
                    <p className="mt-1">Note: {item.note}</p>
                  )}
                </div>
                <p className="mt-2 text-sm font-semibold">
                  Item Total: ${((parseFloat(item.basePrice) + 
                    (item.selectedSize ? parseFloat(item.selectedSize.price) : 0) + 
                    item.selectedAddOns.reduce((sum, addon) => sum + parseFloat(addon.price), 0)) * 
                    item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </ScrollArea>
          {orderTypeEnabled && (
            <div className="mt-4">
              <label htmlFor="orderType" className="block text-sm font-medium text-gray-700 mb-2">
                Order Type
              </label>
              <Select
                value={orderType}
                onValueChange={(value) => setOrderType(value as 'dine-in' | 'takeaway')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select order type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dine-in">Dine-in</SelectItem>
                  <SelectItem value="takeaway">Takeaway</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="mt-4">
            <label htmlFor="specialInstructions" className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions
            </label>
            <Textarea
              id="specialInstructions"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full"
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-4">
          <div className="text-lg font-semibold w-full text-center">
            Total: ${calculateTotal().toFixed(2)}
          </div>
          <Button 
            className="w-full" 
            disabled={cart.length === 0}
            onClick={handlePlaceOrder}
          >
            Place Order
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}