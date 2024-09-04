'use client'

import { useState, useEffect } from 'react'
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Switch } from "../../components/ui/switch"
import { Label } from "../../components/ui/label"
import React from 'react'
import Image from 'next/image'
import { db, storage } from '../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadString } from 'firebase/storage';
import { RestaurantInfo } from '../types/database';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from 'react-responsive'

export default function SettingsPage() {
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>({
    name: '',
    logo: null,
    taxEnabled: false,
    gstEnabled: false,
    serviceChargeEnabled: false,
    gstRate: 9,
    serviceChargeRate: 10,
    paymentMethods: [
      { name: 'Apple Pay', enabled: false },
      { name: 'Grab Pay', enabled: false },
      { name: 'Paynow', enabled: false },
      { name: 'Visa', enabled: false },
      { name: 'Mastercard', enabled: false },
      { name: 'Cash', enabled: false },
    ],
    orderTypeEnabled: true,
    orderConfirmationSettings: {
      showCheckboxes: true,
      showEstimatedTime: true,
      showSimpleMessage: false
    }
  });
  const [isSettingsSaved, setIsSettingsSaved] = useState(false);
  const router = useRouter()
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1024px)' })
  const [username, setUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    const fetchRestaurantInfo = async () => {
      try {
        const restaurantRef = doc(db, 'restaurantInfo', 'main');
        const restaurantSnap = await getDoc(restaurantRef);
        if (restaurantSnap.exists()) {
          const data = restaurantSnap.data() as RestaurantInfo;
          setRestaurantInfo(prevInfo => ({
            ...prevInfo,
            ...data,
            paymentMethods: data.paymentMethods || prevInfo.paymentMethods,
            orderTypeEnabled: data.orderTypeEnabled ?? true,
            orderConfirmationSettings: data.orderConfirmationSettings || {
              showCheckboxes: true,
              showEstimatedTime: true,
              showSimpleMessage: false
            }
          }));
        }
      } catch (error) {
        console.error('Error fetching restaurant info:', error);
      }
    };

    fetchRestaurantInfo();
  }, []);

  const handleSave = async () => {
    try {
      const restaurantRef = doc(db, 'restaurantInfo', 'main');
      await setDoc(restaurantRef, restaurantInfo, { merge: true });

      if (restaurantInfo.logo) {
        const logoRef = ref(storage, 'restaurantLogo');
        await uploadString(logoRef, restaurantInfo.logo, 'data_url');
      }

      setIsSettingsSaved(true);
      setTimeout(() => setIsSettingsSaved(false), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  }

  const handleGoBack = () => {
    router.push('/')
  }

  const handlePaymentMethodToggle = (index: number) => {
    setRestaurantInfo(prevInfo => ({
      ...prevInfo,
      paymentMethods: prevInfo.paymentMethods.map((method, i) => 
        i === index ? { ...method, enabled: !method.enabled } : method
      ),
    }))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setRestaurantInfo(prevInfo => ({ ...prevInfo, logo: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleToggle = (field: keyof RestaurantInfo) => {
    setRestaurantInfo(prevInfo => ({ ...prevInfo, [field]: !prevInfo[field] }));
  };

  const handleSaveAccountSettings = async () => {
    // Implement account settings save logic here
    // This is a placeholder for demonstration
    console.log('Saving account settings:', { username, newPassword })
    alert('Account settings saved successfully')
  }

  const handleDeactivateAccount = () => {
    // Implement account deactivation logic here
    // This is a placeholder for demonstration
    console.log('Deactivating account')
    alert('Account deactivated successfully')
  }

  return (
    <div className={`min-h-screen bg-background p-4 ${isTabletOrMobile ? 'sm:p-4' : 'sm:p-8'}`}>
      <AnimatePresence>
        {isSettingsSaved && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-0 right-0 bg-green-500 text-white p-2 text-center z-50"
          >
            Settings saved successfully
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-3xl font-bold">Settings</CardTitle>
          <Button variant="ghost" onClick={handleGoBack} className="text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex space-x-2 mb-4">
            <Button 
              variant={activeTab === 'general' ? 'default' : 'outline'}
              onClick={() => setActiveTab('general')}
            >
              General
            </Button>
            <Button 
              variant={activeTab === 'account' ? 'default' : 'outline'}
              onClick={() => setActiveTab('account')}
            >
              Account
            </Button>
          </div>

          {activeTab === 'general' && (
            <>
              <div className="space-y-4 border-b pb-4">
                <h2 className="text-xl font-semibold">General Settings</h2>
                <div className="space-y-2">
                  <Label htmlFor="restaurantName">Restaurant Name</Label>
                  <Input
                    id="restaurantName"
                    value={restaurantInfo.name}
                    onChange={(e) => setRestaurantInfo(prevInfo => ({ ...prevInfo, name: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="restaurantLogo">Restaurant Logo</Label>
                  <div className="flex items-center space-x-4">
                    {restaurantInfo.logo && (
                      <Image
                        src={restaurantInfo.logo}
                        alt="Restaurant Logo"
                        width={100}
                        height={100}
                        className="object-contain"
                      />
                    )}
                    <Input
                      id="restaurantLogo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 border-b pb-4">
                <h2 className="text-xl font-semibold">Tax and Charge Settings</h2>
                <div className="flex items-center justify-between">
                  <Label htmlFor="gstEnabled">Enable GST ({restaurantInfo.gstRate}%)</Label>
                  <Switch
                    id="gstEnabled"
                    checked={restaurantInfo.gstEnabled}
                    onCheckedChange={() => handleToggle('gstEnabled')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="serviceChargeEnabled">Enable Service Charge ({restaurantInfo.serviceChargeRate}%)</Label>
                  <Switch
                    id="serviceChargeEnabled"
                    checked={restaurantInfo.serviceChargeEnabled}
                    onCheckedChange={() => handleToggle('serviceChargeEnabled')}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Payment Methods</h2>
                <div className="grid grid-cols-2 gap-4">
                  {restaurantInfo.paymentMethods.map((method, index) => (
                    <div key={method.name} className="flex items-center justify-between p-2 border rounded">
                      <Label htmlFor={`paymentMethod-${method.name}`}>{method.name}</Label>
                      <Switch
                        id={`paymentMethod-${method.name}`}
                        checked={method.enabled}
                        onCheckedChange={() => handlePaymentMethodToggle(index)}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="orderTypeEnabled">Enable Order Type Selection (Dine-in/Takeaway)</Label>
                <Switch
                  id="orderTypeEnabled"
                  checked={restaurantInfo.orderTypeEnabled}
                  onCheckedChange={() => handleToggle('orderTypeEnabled')}
                />
              </div>
              
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Order Confirmation Settings</h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showCheckboxes">Show Order Status Checkboxes</Label>
                    <Switch
                      id="showCheckboxes"
                      checked={restaurantInfo.orderConfirmationSettings?.showCheckboxes ?? true}
                      onCheckedChange={(checked) => setRestaurantInfo(prevInfo => ({
                        ...prevInfo,
                        orderConfirmationSettings: {
                          ...prevInfo.orderConfirmationSettings,
                          showCheckboxes: checked
                        }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showEstimatedTime">Show Estimated Time</Label>
                    <Switch
                      id="showEstimatedTime"
                      checked={restaurantInfo.orderConfirmationSettings?.showEstimatedTime ?? true}
                      onCheckedChange={(checked) => setRestaurantInfo(prevInfo => ({
                        ...prevInfo,
                        orderConfirmationSettings: {
                          ...prevInfo.orderConfirmationSettings,
                          showEstimatedTime: checked
                        }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showSimpleMessage">Show Simple Thank You Message</Label>
                    <Switch
                      id="showSimpleMessage"
                      checked={restaurantInfo.orderConfirmationSettings?.showSimpleMessage ?? false}
                      onCheckedChange={(checked) => setRestaurantInfo(prevInfo => ({
                        ...prevInfo,
                        orderConfirmationSettings: {
                          ...prevInfo.orderConfirmationSettings,
                          showSimpleMessage: checked
                        }
                      }))}
                    />
                  </div>
                </div>
              </div>
              
              <Button onClick={handleSave} className="w-full bg-black text-white hover:bg-gray-800">
                Save Settings
              </Button>
            </>
          )}

          {activeTab === 'account' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveAccountSettings} className="w-full">
                Save Account Settings
              </Button>
              <Button onClick={handleDeactivateAccount} variant="destructive" className="w-full">
                Deactivate Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}