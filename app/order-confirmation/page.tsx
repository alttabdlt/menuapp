'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Order } from '../types/database';
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Star } from 'lucide-react'
import { db } from '../../lib/firebase'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Textarea } from '../../components/ui/Textarea'
import { useMediaQuery } from 'react-responsive'

const orderStatuses = [
  'Order Received',
  'Preparing',
  'Ready to Serve',
  'Served'
]

export default function OrderConfirmationPage() {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean | null>(null);
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [orderStatus, setOrderStatus] = useState('Order Received');
  const [rating, setRating] = useState(0);
  const [isRatingSubmitted, setIsRatingSubmitted] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isAssistanceDisabled, setIsAssistanceDisabled] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order[]>([]);
  const { toast } = useToast();
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1024px)' })
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('orderId');
    const number = params.get('orderNumber');
    const success = params.get('paymentSuccess');

    console.log('URL Parameters:', { id, number, success });

    if (id) setOrderId(id);
    if (number) setOrderNumber(number);
    if (success) setPaymentSuccess(success === 'true');

    // Set up real-time listener for order status
    if (id) {
      const orderRef = doc(db, 'orders', id);
      const unsubscribe = onSnapshot(orderRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setOrderStatus(data.status);
          if (!orderNumber) {
            setOrderNumber(data.orderNumber);
          }
          if (data.rating) {
            setRating(data.rating);
            setIsRatingSubmitted(true);
          }
        }
      });

      // Clean up the listener when the component unmounts
      return () => unsubscribe();
    }
  }, []);

  const handleRequestAssistance = () => {
    toast({
      title: "Assistance Requested",
      description: "A waiter will tend to you soon. Thank you for your patience.",
      duration: 3000,
    })
    setIsAssistanceDisabled(true)
    setTimeout(() => setIsAssistanceDisabled(false), 180000) // 3 minutes
  }

  const handleRatingSubmit = async (newRating: number) => {
    if (orderId) {
      try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { rating: newRating });
        setRating(newRating);
        setIsRatingSubmitted(true);
        toast({
          title: "Rating Submitted",
          description: "Thank you for your feedback!",
          duration: 3000,
        });
      } catch (error) {
        console.error('Error submitting rating:', error);
        toast({
          title: "Error",
          description: "Failed to submit rating. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  }

  const handleFeedbackSubmit = async () => {
    if (orderId && feedback.trim()) {
      try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { feedback: feedback.trim() });
        toast({
          title: "Feedback Submitted",
          description: "Thank you for your feedback!",
          duration: 3000,
        });
        setIsFeedbackSubmitted(true);
      } catch (error) {
        console.error('Error submitting feedback:', error);
        toast({
          title: "Error",
          description: "Failed to submit feedback. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  }

  if (paymentSuccess !== true) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center text-red-500">Error: Payment not confirmed. Please try again.</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-background p-4 ${isTabletOrMobile ? 'sm:p-6' : 'sm:p-8'}`}>
      <Card className={`max-w-md mx-auto ${isTabletOrMobile ? 'p-4' : 'p-6'}`}>
        <CardHeader className="flex flex-col items-start space-y-2">
          <CardTitle className={`text-xl ${isTabletOrMobile ? 'sm:text-xl' : 'sm:text-2xl'} font-bold`}>
            Order #{orderNumber || 'Loading...'} Status
          </CardTitle>
          <Link href="/menu/live" passHref>
            <Button variant="outline" className={`w-full ${isTabletOrMobile ? 'text-xs' : 'text-sm'}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Menu
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
            <h2 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Estimated Time</h2>
            <p className="text-sm sm:text-base">Your order will be served in approximately {estimatedTime} minutes.</p>
          </div>

          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-300"></div>
            {orderStatuses.map((status, index) => (
              <div key={status} className="flex items-center mb-3 sm:mb-4 relative">
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${
                  index === 0 || index <= orderStatuses.indexOf(orderStatus) ? 'bg-green-500' : 'bg-gray-300'
                } mr-3 z-10`}></div>
                <span className={`text-sm sm:text-base ${orderStatus === status ? 'font-semibold' : ''}`}>{status}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Need help?</h3>
            <div className="flex justify-center">
              <Button 
                className="w-full text-sm" 
                onClick={handleRequestAssistance}
                disabled={isAssistanceDisabled}
              >
                {isAssistanceDisabled ? 'Assistance Requested' : 'Request Assistance'}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
          <h3 className="text-base sm:text-lg font-semibold">Rate your experience</h3>
          <div className="flex space-x-1 sm:space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                key={star}
                variant="ghost"
                size="sm"
                onClick={() => !isRatingSubmitted && handleRatingSubmit(star)}
                disabled={isRatingSubmitted}
              >
                <Star
                  className={`h-5 w-5 sm:h-6 sm:w-6 ${
                    star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                  }`}
                />
              </Button>
            ))}
          </div>
          {isRatingSubmitted && (
            <p className="text-xs sm:text-sm text-muted-foreground">Thanks for your rating!</p>
          )}
          <div className="w-full mt-4 flex flex-col items-center">
            <h3 className="text-base sm:text-lg font-semibold mb-2">Leave a feedback</h3>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us about your experience..."
              className="w-full mb-2"
              disabled={isFeedbackSubmitted}
            />
            <Button 
              onClick={handleFeedbackSubmit} 
              disabled={!feedback.trim() || isFeedbackSubmitted}
              className="mt-2"
            >
              {isFeedbackSubmitted ? "Feedback Submitted" : "Submit Feedback"}
            </Button>
          </div>
        </CardFooter>
      </Card>
      <Toaster />
    </div>
  )
}