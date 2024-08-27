import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from '../../../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orderId } = req.query

  console.log('Received request for orderId:', orderId);

  if (!orderId || typeof orderId !== 'string') {
    console.log('Invalid order ID');
    return res.status(400).json({ error: 'Invalid order ID' });
  }

  try {
    const orderRef = doc(db, 'orders', orderId)
    const orderSnap = await getDoc(orderRef)

    if (orderSnap.exists()) {
      const orderData = orderSnap.data()
      console.log('Order data:', orderData);
      res.status(200).json({ status: orderData.status, orderNumber: orderData.orderNumber })
    } else {
      console.log('Order not found');
      res.status(404).json({ error: 'Order not found' })
    }
  } catch (error) {
    console.error('Error fetching order status:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}