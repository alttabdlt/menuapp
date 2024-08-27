'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Search, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useCart } from '../../../context/CartContext'
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../../components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog"
import { Badge } from "../../../components/ui/badge"
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import React from 'react'
import { db } from '../../../lib/firebase'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { MenuItem, Category, CartItem } from '../../types/database';

const MAX_CART_ITEMS = 20;

const calculateTotal = (cart: CartItem[]): number => {
  return cart.reduce((total, item) => {
    const itemPrice = parseFloat(item.basePrice);
    const sizePrice = item.selectedSize ? parseFloat(item.selectedSize.price) : 0;
    const addOnsPrice = item.selectedAddOns.reduce((sum, addOn) => sum + parseFloat(addOn.price), 0);
    return total + (itemPrice + sizePrice + addOnsPrice) * item.quantity;
  }, 0);
};
export default function LiveMenuPage() {
  const { cart, addToCart, removeFromCart } = useCart()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  const [configItem, setConfigItem] = useState<MenuItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const router = useRouter()
  const [restaurantName, setRestaurantName] = useState('Restaurant Name')
  const [selectedSize, setSelectedSize] = useState<{ name: string; price: string } | null>(null)
  const [selectedAddOns, setSelectedAddOns] = useState<{ name: string; price: string }[]>([])
  const [categoryPage, setCategoryPage] = useState(0)
  const categoriesPerPageMobile = 4
  const categoriesPerPageDesktop = 8
  const [logo, setLogo] = useState<string | null>(null)

  const visibleCategories = categories.slice(
    categoryPage * categoriesPerPageMobile,
    (categoryPage + 1) * categoriesPerPageMobile
  )

  const visibleCategoriesDesktop = categories.slice(0, categoriesPerPageDesktop)

  const nextCategoryPage = () => {
    if ((categoryPage + 1) * categoriesPerPageMobile < categories.length) {
      setCategoryPage(categoryPage + 1)
    }
  }

  const prevCategoryPage = () => {
    if (categoryPage > 0) {
      setCategoryPage(categoryPage - 1)
    }
  }

  useEffect(() => {
    const loadDeployedMenu = async () => {
      try {
        // Load menu items
        const menuItemsSnapshot = await getDocs(collection(db, 'deployedMenuItems'));
        const menuItemsList = menuItemsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as MenuItem[];
        setMenuItems(menuItemsList);

        // Load categories
        const categoriesSnapshot = await getDocs(collection(db, 'deployedCategories'));
        const categoriesList = categoriesSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Category[];
        setCategories(categoriesList);

        // Load restaurant info
        const restaurantInfoDoc = await getDoc(doc(db, 'restaurantInfo', 'main'));
        if (restaurantInfoDoc.exists()) {
          const restaurantData = restaurantInfoDoc.data();
          setRestaurantName(restaurantData.name || 'Restaurant Name');
          setLogo(restaurantData.logo || null);
        }
      } catch (error) {
        console.error('Error loading deployed menu:', error);
        // Handle error (e.g., show an error message to the user)
      }
    };

    loadDeployedMenu();
  }, []);

  useEffect(() => {
    const filtered = menuItems.filter(item =>
      (selectedCategory ? item.categoryId === selectedCategory : true) &&
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredItems(filtered)
  }, [searchTerm, menuItems, selectedCategory])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleAddToCart = (item: MenuItem, addOns: { name: string; price: string }[], quantity: number, note: string, size?: { name: string; price: string }) => {
    if (cart.length >= MAX_CART_ITEMS) {
      setNotification(`Sorry, you can't add more than ${MAX_CART_ITEMS} items to your cart.`)
      return
    }
  
    const cartItem: CartItem = {
      ...item,
      quantity,
      selectedSize: size,
      selectedAddOns: addOns,
      note
    }
    addToCart(cartItem)
    setNotification(`${item.name} has been added to your cart.`)
  }

  const handleCheckout = () => {
    setIsCartOpen(false)
    router.push('/checkout')
  }

  function updateCartItemQuantity(id: string, arg1: number): void {
    throw new Error('Function not implemented.')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-4 right-4 z-50 flex justify-center items-center"
          >
            <div className="bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg flex items-center justify-between max-w-md w-full">
              <span className="mr-2">{notification}</span>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto"
                onClick={() => setNotification(null)}
              >
                <X size={16} />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={configItem !== null} onOpenChange={(open) => !open && setConfigItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{configItem?.name}</DialogTitle>
          </DialogHeader>
          {configItem && (
            <div className="grid gap-4">
              <Image
                src={configItem.image || '/placeholder.svg'}
                alt={configItem.name}
                width={300}
                height={200}
                className="w-full h-48 object-cover rounded-md"
              />
              <p className="text-sm text-muted-foreground">{configItem.description}</p>
              {configItem.sizes.length > 0 && (
                <div className="grid gap-2">
                  <h3 className="font-semibold">Size</h3>
                  {configItem.sizes.map((size) => (
                    <Button
                      key={size.name}
                      variant={selectedSize?.name === size.name ? "default" : "outline"}
                      className="justify-between"
                      onClick={() => setSelectedSize(selectedSize?.name === size.name ? null : size)}
                    >
                      {size.name}
                      <span>${parseFloat(size.price).toFixed(2)}</span>
                    </Button>
                  ))}
                </div>
              )}
              {configItem.addOns.length > 0 && (
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Add-ons</h3>
                    {selectedAddOns.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => setSelectedAddOns([])}>
                        Clear all
                      </Button>
                    )}
                  </div>
                  <Button
                    key="none"
                    variant={selectedAddOns.length === 0 ? "default" : "outline"}
                    className="justify-between"
                    onClick={() => setSelectedAddOns([])}
                  >
                    None
                    <span>+$0.00</span>
                  </Button>
                  {configItem.addOns.filter(addOn => addOn.name !== 'None').map((addOn) => (
                    <Button
                      key={addOn.name}
                      variant={selectedAddOns.some(a => a.name === addOn.name) ? "default" : "outline"}
                      className="justify-between"
                      onClick={() => {
                        if (selectedAddOns.some(a => a.name === addOn.name)) {
                          setSelectedAddOns(selectedAddOns.filter(a => a.name !== addOn.name));
                        } else {
                          setSelectedAddOns([...selectedAddOns, addOn]);
                        }
                      }}
                    >
                      {addOn.name}
                      <span>+${parseFloat(addOn.price).toFixed(2)}</span>
                    </Button>
                  ))}
                </div>
              )}
              <Button
                className="w-full mt-4"
                onClick={() => {
                  handleAddToCart(configItem, selectedAddOns, 1, '', selectedSize || undefined);
                  setConfigItem(null);
                  setSelectedSize(null);
                  setSelectedAddOns([]);
                }}
              >
                Add to Cart
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <header className="bg-card shadow-md fixed top-0 left-0 right-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {logo && (
              <Image
                src={logo}
                alt="Restaurant Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            )}
            <h1 className="text-xl font-bold">{restaurantName}</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/cart')} className="font-medium text-base antialiased">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Cart <Badge variant="secondary" className="ml-1">{cart.length}</Badge>
          </Button>
        </div>
      </header>

      <main className="flex-grow mt-16 mb-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="my-4">
            <h2 className="text-xl font-semibold mb-2">Menu Categories</h2>
            <p className="text-sm text-muted-foreground">Browse our delicious offerings</p>
          </div>

          <div className="bg-card rounded-lg p-4 relative">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-0 z-10 h-full md:hidden"
                onClick={prevCategoryPage}
                disabled={categoryPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex overflow-x-auto scrollbar-hide space-x-4 px-6 md:px-0">
                {/* Mobile view */}
                <div className="flex md:hidden no-scrollbar">
                  {visibleCategories.map((category) => (
                    <CategoryButton key={category.id} category={category} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />
                  ))}
                </div>
                
                {/* Desktop view */}
                <div className="hidden md:flex">
                  {visibleCategoriesDesktop.map((category) => (
                    <CategoryButton key={category.id} category={category} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />
                  ))}
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 z-10 h-full md:hidden"
                onClick={nextCategoryPage}
                disabled={(categoryPage + 1) * categoriesPerPageMobile >= categories.length}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>

          <div className="mt-4">
            {categories.map(category => {
              const categoryItems = filteredItems.filter(item => item.categoryId === category.id)
              if (categoryItems.length === 0) return null

              return (
                <div key={category.id} className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">{category.name}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {categoryItems.map((item) => (
                      <Card key={item.id} className="flex flex-col h-full">
                        <CardHeader className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 pr-4">
                              <CardTitle className="text-lg">{item.name}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                                {item.description.split(' ').slice(0, 20).join(' ') }
                                {item.description.split(' ').length > 20 ? '...' : ''}
                              </p>
                            </div>
                            <div className="w-24 h-24 flex-shrink-0 relative rounded-md overflow-hidden">
                              <Image
                                src={item.image || '/placeholder.svg'}
                                alt={item.name}
                                layout="fill"
                                objectFit="cover"
                              />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex-grow">
                          <p className="font-semibold">${parseFloat(item.basePrice).toFixed(2)}</p>
                        </CardContent>
                        <CardFooter className="p-4 pt-0">
                          <Button className="w-full" onClick={() => setConfigItem(item)}>
                            Add to Cart
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}

// Separate component for category button to reduce duplication
const CategoryButton = ({ 
  category, 
  selectedCategory, 
  setSelectedCategory 
}: {
  category: { id: string; name: string; image?: string };
  selectedCategory: string | null;
  setSelectedCategory: (categoryId: string | null) => void;
}) => (
  <Button
    variant={selectedCategory === category.id ? "default" : "ghost"}
    className={`flex flex-col items-center justify-center p-2 w-20 h-20 md:w-24 md:h-24 ${
      selectedCategory === category.id ? 'bg-primary text-primary-foreground' : ''
    }`}
    onClick={() => setSelectedCategory(category.id === selectedCategory ? null : category.id)}
  >
    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden mb-1 flex items-center justify-center ${
      category.image ? '' : 'bg-gray-200'
    }`}>
      {category.image ? (
        <Image
          src={category.image}
          alt={category.name}
          width={48}
          height={48}
          className="object-cover w-full h-full"
        />
      ) : (
        <span className="text-lg font-bold text-gray-500">{category.name.charAt(0)}</span>
      )}
    </div>
    <span className="text-xs md:text-sm text-center truncate w-full">{category.name}</span>
  </Button>
)