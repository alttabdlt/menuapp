'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import Image from 'next/image'
import React from 'react'
import { CartItem } from '../types/database';
import { useMediaQuery } from 'react-responsive'

export default function CartPage() {
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1024px)' })
  const { cart, removeFromCart, updateQuantity, calculateTotal } = useCart()
  const router = useRouter()

  const handleProceedToCheckout = () => {
    router.push('/checkout')
  }

  return (
    <div className={`min-h-screen bg-background p-4 ${isTabletOrMobile ? 'sm:p-6' : 'sm:p-8'}`}>
      <Card className={`max-w-2xl mx-auto ${isTabletOrMobile ? 'p-4' : 'p-6'}`}>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <CardTitle className={`text-2xl ${isTabletOrMobile ? 'sm:text-2xl' : 'sm:text-3xl'} font-bold`}>Your Cart</CardTitle>
          <Link href="/menu/live" passHref>
            <Button variant="outline" className={`w-full ${isTabletOrMobile ? 'sm:w-auto' : ''}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Menu
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground">Your cart is empty.</p>
          ) : (
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div key={index} className="flex flex-col border-b pb-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 relative rounded-md overflow-hidden">
                        <Image
                          src={item.image || '/placeholder.svg'}
                          alt={item.name}
                          layout="fill"
                          objectFit="cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ${parseFloat(item.basePrice).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span>{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
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
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="text-lg font-semibold">
            Total: ${calculateTotal().toFixed(2)}
          </div>
          <Button 
            className="w-full sm:w-auto" 
            disabled={cart.length === 0}
            onClick={handleProceedToCheckout}
          >
            Proceed to Checkout
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}