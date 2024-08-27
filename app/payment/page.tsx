'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { log, useCart } from '../../context/CartContext'
import Image from 'next/image'
import React from 'react'
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../components/ui/card"
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Separator } from "../../components/ui/separator"
import { addDoc, collection, doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { RestaurantInfo } from '../types/database'
import { useMediaQuery } from 'react-responsive'

type SavedPaymentMethod = { name: string; enabled: boolean };

const paymentMethods = [
  { name: 'Apple Pay', image: '/images/payment/apple-pay-logo.png' },
  { name: 'Grab Pay', image: '/images/payment/grab-pay-logo.png' },
  { name: 'Paynow', image: '/images/payment/paynow-logo.png' },
  { name: 'Visa', image: '/images/payment/visa-logo.png' },
  { name: 'Mastercard', image: '/images/payment/mastercard-logo.png' },
  { name: 'Cash', image: '/images/payment/cash-icon.jpg' },
]

export default function PaymentPage() {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState(paymentMethods)
  const [taxEnabled, setTaxEnabled] = useState(false)
  const [gstEnabled, setGstEnabled] = useState(false)
  const [serviceChargeEnabled, setServiceChargeEnabled] = useState(false)
  const [taxRate, setTaxRate] = useState(7)
  const [gstRate, setGstRate] = useState(9)
  const [serviceChargeRate, setServiceChargeRate] = useState(10)
  const [paymentProcessed, setPaymentProcessed] = useState(false)
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>('dine-in');

  const router = useRouter()
  const { cart, clearCart, calculateTotal } = useCart()
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1024px)' })

  useEffect(() => {
    const fetchSettings = async () => {
      const restaurantRef = doc(db, 'restaurantInfo', 'main');
      const restaurantSnap = await getDoc(restaurantRef);
      if (restaurantSnap.exists()) {
        const data = restaurantSnap.data() as RestaurantInfo;
        setEnabledPaymentMethods(paymentMethods.filter(method => 
          data.paymentMethods.find(pm => pm.name === method.name && pm.enabled)
        ));
        setGstEnabled(data.gstEnabled);
        setServiceChargeEnabled(data.serviceChargeEnabled);
        setGstRate(data.gstRate);
        setServiceChargeRate(data.serviceChargeRate);
      }
    };

    fetchSettings();

    log('PaymentPage mounted');
    if (cart.length === 0 && !paymentProcessed) {
      log('Cart is empty and payment not processed, redirecting to menu');
      router.push('/menu/live');
    }

    const params = new URLSearchParams(window.location.search);
    const type = params.get('orderType');
    if (type === 'dine-in' || type === 'takeaway') {
      setOrderType(type);
    }
  }, [cart, paymentProcessed, router]);

  const handlePaymentSubmit = async () => {
    log('Payment submit clicked');
    setIsProcessing(true);
    try {
      // Simulate API call to process the order
      await new Promise(resolve => setTimeout(resolve, 2000));
      log(`Order submitted with payment method: ${selectedPaymentMethod}`);

      // Process payment logic here (simplified for this example)
      switch (selectedPaymentMethod) {
        case 'Apple Pay':
        case 'Grab Pay':
        case 'Paynow':
        case 'Visa':
        case 'Mastercard':
        case 'Cash':
          // Simulating successful payment for all methods
          break;
        default:
          throw new Error('Unsupported payment method');
      }

      log('Payment successful, updating database');

      const generateOrderNumber = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
      };

      const orderNumber = generateOrderNumber();

      // Prepare order data, ensuring all fields are defined
      const orderData = {
        orderNumber,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          basePrice: item.basePrice,
          selectedSize: item.selectedSize || null,
          selectedAddOns: item.selectedAddOns || [],
          note: item.note || ''
        })),
        status: 'Received',
        placedAt: new Date(),
        paymentMethod: selectedPaymentMethod,
        total: calculateTotalWithCharges(),
        specialInstructions: '', // Add this if you have special instructions
        orderType: orderType,
      };

      console.log('Order data to be saved:', orderData);

      // Create a new order in Firebase
      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      console.log('Created order with ID:', orderRef.id);
      log('Order added to database');

      // Clear the cart immediately
      clearCart();
      log('Cart cleared after payment');

      // Redirect to order confirmation page
      const confirmationUrl = `/order-confirmation?orderId=${orderRef.id}&paymentSuccess=true&orderNumber=${orderNumber}`;
      console.log('Redirecting to:', confirmationUrl);
      router.push(confirmationUrl);

      // Set payment as processed after redirecting
      setPaymentProcessed(true);

    } catch (error) {
      log(`Error processing payment: ${error}`);
      alert('There was an error processing your payment. Please try again.');
      router.push('/order-confirmation?paymentSuccess=false');
    } finally {
      setIsProcessing(false);
    }
  }

  const calculateTotalWithCharges = () => {
    let total = calculateTotal();
    if (serviceChargeEnabled) {
      total *= (1 + serviceChargeRate / 100);
    }
    if (gstEnabled) {
      total *= (1 + (serviceChargeEnabled ? serviceChargeRate / 100 : 0)) * (1 + gstRate / 100);
    }
    return total;
  }

  return (
    <div className={`min-h-screen bg-background p-4 md:p-8 ${isTabletOrMobile ? 'px-4' : 'px-8'}`}>
      <Card className="max-w-md mx-auto">
        <CardHeader className="flex flex-col items-start space-y-2">
          <CardTitle className="text-2xl font-bold">Select Payment Method</CardTitle>
          <Link href="/checkout" passHref>
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Checkout
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <h2 className="text-lg font-semibold mb-4">Payment Methods</h2>
            <div className="grid grid-cols-3 gap-4">
              {enabledPaymentMethods.map((method) => (
                <Button
                  key={method.name}
                  onClick={() => setSelectedPaymentMethod(method.name)}
                  variant="outline"
                  className={`p-2 h-auto flex flex-col items-center justify-center ${
                    selectedPaymentMethod === method.name ? 'border-2 border-primary font-bold' : ''
                  }`}
                >
                  <Image
                    src={method.image}
                    alt={method.name}
                    width={40}
                    height={40}
                    objectFit="contain"
                  />
                </Button>
              ))}
            </div>
          </div>
          <Separator className="my-6" />
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-start">
                  <div>
                    <span>{item.name} x{item.quantity}</span>
                    {item.selectedSize && (
                      <p className="text-sm text-gray-600">Size: {item.selectedSize.name}</p>
                    )}
                    {item.selectedAddOns.length > 0 && (
                      <p className="text-sm text-gray-600">
                        Add-ons: {item.selectedAddOns.map(addOn => addOn.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <span>${((parseFloat(item.basePrice) + 
                    (item.selectedSize ? parseFloat(item.selectedSize.price) : 0) + 
                    item.selectedAddOns.reduce((sum, addon) => sum + parseFloat(addon.price), 0)) * 
                    item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <Separator className="my-2" />
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Subtotal</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
              {serviceChargeEnabled && (
                <div className="flex justify-between items-center">
                  <span>Service Charge ({serviceChargeRate}%)</span>
                  <span>${(calculateTotal() * (serviceChargeRate / 100)).toFixed(2)}</span>
                </div>
              )}
              {gstEnabled && (
                <div className="flex justify-between items-center">
                  <span>GST ({gstRate}%)</span>
                  <span>${(calculateTotal() * (1 + (serviceChargeEnabled ? serviceChargeRate / 100 : 0)) * (gstRate / 100)).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center mt-2">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">
                  ${calculateTotalWithCharges().toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          {selectedPaymentMethod && (
            <>
              <Separator className="my-6" />
              <div className="bg-gray-100 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-4">Payment Details for {selectedPaymentMethod}</h2>
                {selectedPaymentMethod === 'Visa' || selectedPaymentMethod === 'Mastercard' ? (
                  <div className="space-y-2">
                    <Input type="text" placeholder="Card Number" />
                    <div className="flex space-x-2">
                      <Input type="text" placeholder="MM/YY" className="w-1/2" />
                      <Input type="text" placeholder="CVV" className="w-1/2" />
                    </div>
                  </div>
                ) : selectedPaymentMethod === 'Paynow' ? (
                  <div>
                    <p className="mb-2">Scan the QR code to complete the payment.</p>
                    <Image src="/images/payment/paynow-qr.png" alt="Paynow QR" width={200} height={200} className="mx-auto" />
                  </div>
                ) : selectedPaymentMethod === 'Cash' ? (
                  <p>Please pay at the counter.</p>
                ) : (
                  <p>Proceed with {selectedPaymentMethod}.</p>
                )}
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handlePaymentSubmit}
            className="w-full"
            disabled={!selectedPaymentMethod || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Complete Payment'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}