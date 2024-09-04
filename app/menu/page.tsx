"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react'
import { PlusCircle, Edit, Eye, ShoppingCart, Menu as MenuIcon, Settings, ArrowRightLeft, ChevronDown, ChevronUp, Search, X, Trash2, Sparkles, Utensils, MonitorPlay, TableProperties } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { Textarea } from '../../components/ui/Textarea'
import React from 'react';
import { ConfirmationDialog } from '../../components/ConfirmationDialog'
import { db, storage } from '../../lib/firebase'; // Import Firebase modules
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, uploadBytes } from 'firebase/storage';
import toast from 'react-hot-toast';
import { MenuItem, Category } from '../types/database';

export default function Component() {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategory, setNewCategory] = useState({ name: '', description: '', image: '' })
  const [isDeployed, setIsDeployed] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [logo, setLogo] = useState<string | null>(null)
  const [showDeployConfirmation, setShowDeployConfirmation] = useState(false)
  const [restaurantName, setRestaurantName] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const menuItemsCollection = collection(db, 'menuItems');
        const menuItemsSnapshot = await getDocs(menuItemsCollection);
        const menuItemsList = menuItemsSnapshot.docs.map(doc => {
          const data = doc.data() as MenuItem;
          console.log("Fetched item ID:", doc.id);
          return { 
            ...data,
            id: doc.id // Ensure the id is always set from the document ID
          };
        });
        console.log("Fetched menu items:", menuItemsList);
        setMenuItems(menuItemsList);
      } catch (error) {
        console.error('Error fetching menu items:', error);
        toast.error('Failed to load menu items. Please try again.');
      }
    };

    fetchMenuItems();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesCollection = collection(db, 'categories');
        const categoriesSnapshot = await getDocs(categoriesCollection);
        const categoriesList: Category[] = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          description: doc.data().description || '',
          dishes: doc.data().dishes || [],
          image: doc.data().image || ''
        }));
        setCategories(categoriesList);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories. Please try again.');
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchRestaurantInfo = async () => {
      try {
        const restaurantDoc = await getDocs(collection(db, 'restaurantInfo'));
        if (!restaurantDoc.empty) {
          const restaurantData = restaurantDoc.docs[0].data();
          setLogo(restaurantData.logo || null);
          setRestaurantName(restaurantData.name || '');
        }
      } catch (error) {
        console.error('Error fetching restaurant info:', error);
        toast.error('Failed to load restaurant info. Please try again.');
      }
    };

    fetchRestaurantInfo();
  }, []);

  const handleDeployConfirm = async () => {
    setShowDeployConfirmation(false);
    setIsDeploying(true);
    try {
      // Upload menu items
      for (const item of menuItems) {
        const itemRef = doc(db, 'deployedMenuItems', item.id);
        let imageUrl = item.image;

        if (item.image && item.image.startsWith('data:')) {
          // It's a new image (data URL), upload it
          const imageRef = ref(storage, `menuItemImages/${item.id}`);
          const uploadResult = await uploadString(imageRef, item.image, 'data_url');
          imageUrl = await getDownloadURL(uploadResult.ref);
        }

        await setDoc(itemRef, {
          ...item,
          image: imageUrl
        }, { merge: true });
      }

      // Upload categories
      for (const category of categories) {
        const categoryRef = doc(db, 'deployedCategories', category.id);
        let imageUrl = category.image;

        if (category.image && category.image.startsWith('data:')) {
          // It's a new image (data URL), upload it
          const imageRef = ref(storage, `categoryImages/${category.id}`);
          const uploadResult = await uploadString(imageRef, category.image, 'data_url');
          imageUrl = await getDownloadURL(uploadResult.ref);
        }

        await setDoc(categoryRef, {
          ...category,
          image: imageUrl
        }, { merge: true });
      }

      // Save restaurant info
      const restaurantInfoRef = doc(db, 'restaurantInfo', 'main');
      await setDoc(restaurantInfoRef, {
        name: restaurantName,
        logo: logo
      }, { merge: true });

      // Clean up menu items
      const deployedItemsSnapshot = await getDocs(collection(db, 'deployedMenuItems'));
      const deployedItemIds = new Set(menuItems.map(item => item.id));
      
      for (const doc of deployedItemsSnapshot.docs) {
        if (!deployedItemIds.has(doc.id)) {
          await deleteDoc(doc.ref);
        }
      }

      // Clean up categories
      const deployedCategoriesSnapshot = await getDocs(collection(db, 'deployedCategories'));
      const deployedCategoryIds = new Set(categories.map(category => category.id));
      
      for (const doc of deployedCategoriesSnapshot.docs) {
        if (!deployedCategoryIds.has(doc.id)) {
          await deleteDoc(doc.ref);
        }
      }

      toast.success('Menu deployed successfully');
    } catch (error) {
      console.error('Error deploying menu:', error);
      toast.error('Failed to deploy menu. Please try again.');
    } finally {
      setIsDeploying(false);
    }
  };

  const deployMenu = () => {
    console.log('deployMenu function called');
    setShowDeployConfirmation(true);
    console.log('showDeployConfirmation set to true');
  }

  const addOrUpdateCategory = async () => {
    if (newCategory.name.trim()) {
      const updatedCategory = {
        ...newCategory,
        image: newCategory.image || ''
      };
      try {
        if (editingCategory) {
          await updateDoc(doc(db, 'categories', editingCategory.id), updatedCategory);
        } else {
          await addDoc(collection(db, 'categories'), updatedCategory);
        }
        
        // Fetch updated categories
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        const categoriesList = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Category));
        
        setCategories(categoriesList);
        setNewCategory({ name: '', description: '', image: '' });
        setEditingCategory(null);
        setShowCategoryModal(false);
        toast.success('Category saved successfully');
      } catch (error) {
        console.error('Error saving category:', error);
        toast.error('Failed to save category. Please try again.');
      }
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setNewCategory({ name: category.name, description: category.description, image: category.image })
    setShowCategoryModal(true)
  }

  const handleCategoryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewCategory(prev => ({ ...prev, image: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(prevCategory => prevCategory === categoryId ? null : categoryId)
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const filteredMenuItems = selectedCategory
    ? menuItems.filter(item => item.categoryId && item.categoryId.split(',').includes(selectedCategory))
    : menuItems

  const searchedMenuItems = filteredMenuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const generateCategoryDescription = async (name: string) => {
    try {
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type: 'category' }),
      });
      const data = await response.json();
      return data.description;
    } catch (error) {
      console.error('Error generating category description:', error);
      return '';
    }
  }

  const handleDeleteMenuItem = async (itemId: string) => {
    console.log("Delete button clicked, itemId:", itemId);
    const itemToDelete = menuItems.find(item => item.id === itemId);
    console.log("Item to delete:", itemToDelete);

    if (!itemId || itemId.trim() === '') {
      console.error('Invalid item ID');
      toast.error('Cannot delete item: Invalid ID');
      return;
    }

    if (window.confirm('Are you sure you want to delete this menu item?')) {
      console.log("Confirmation received, proceeding with deletion");
      try {
        // Delete from Firestore
        console.log("Attempting to delete from Firestore");
        await deleteDoc(doc(db, 'menuItems', itemId));
        console.log("Firestore deletion successful");
        
        // Update local state
        console.log("Updating local state");
        setMenuItems(prevItems => {
          const newItems = prevItems.filter(item => item.id !== itemId);
          console.log("New menuItems state:", newItems);
          return newItems;
        });
        
        console.log("Showing success toast");
        toast.success('Menu item deleted successfully');
      } catch (error) {
        console.error('Error deleting menu item:', error);
        toast.error('Failed to delete menu item. Please try again.');
      }
    } else {
      console.log("Deletion cancelled by user");
    }
  };

  useEffect(() => {
    console.log("menuItems state updated:", menuItems);
  }, [menuItems]);

  useEffect(() => {
    console.log('showDeployConfirmation changed:', showDeployConfirmation);
  }, [showDeployConfirmation]);

  useEffect(() => {
    console.log('isDeployed changed:', isDeployed);
  }, [isDeployed]);

  return (
    <div className="flex flex-col h-screen bg-background">
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
                <h2 className="text-xl font-semibold">Menu Management</h2>
              </div>
              <nav>
                <ul className="space-y-4">
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
                  <li>
                    <Button asChild variant="ghost" className="w-full justify-start">
                      <Link href="/">
                        <ArrowRightLeft size={20} className="mr-2" />
                        Back to Admin
                      </Link>
                    </Button>
                  </li>
                  <li className="mt-auto">
                    <Button 
                      variant="default" 
                      className="w-full justify-start"
                      onClick={deployMenu}
                      disabled={isDeploying}
                    >
                      <ArrowRightLeft size={20} className="mr-2" />
                      {isDeploying ? 'Deploying...' : 'Deploy to Live'}
                    </Button>
                  </li>
                </ul>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className={`flex-1 p-4 md:p-8 transition-all duration-300`}>
        <AnimatePresence>
          {isDeployed && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="fixed top-0 left-0 right-0 bg-green-500 text-white p-2 text-center z-50"
            >
              Successfully deployed
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button variant="outline" size="icon" onClick={toggleSidebar} className="mr-4">
              <MenuIcon size={24} />
            </Button>
            <h1 className="text-3xl font-bold">Menu Management</h1>
          </div>
        </div>

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

        {/* Categories Section */}
        <Card className="mb-4 md:mb-8">
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2 md:space-x-4 overflow-x-auto pb-4">
              {categories.map(category => (
                <motion.div
                  key={category.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex flex-col items-center min-w-[80px] cursor-pointer ${selectedCategory === category.id ? 'opacity-100' : 'opacity-60'}`}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-2 relative">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.name}
                        width={64}
                        height={64}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <ShoppingCart size={24} className="text-orange-500" />
                    )}
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute -top-1 -right-1 h-6 w-6 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditCategory(category)
                      }}
                    >
                      <Edit size={12} />
                    </Button>
                  </div>
                  <span className="text-xs text-center font-medium">{category.name}</span>
                </motion.div>
              ))}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center min-w-[80px]"
              >
                <Button
                  size="icon"
                  variant="outline"
                  className="w-16 h-16 rounded-full mb-2"
                  onClick={() => setShowCategoryModal(true)}
                >
                  <PlusCircle size={24} />
                </Button>
                <span className="text-xs text-center font-medium">Add Category</span>
              </motion.div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Collapse Controls */}
        <div className="flex items-center mb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleCollapse}
            className="mr-4"
            aria-label={isCollapsed ? "Expand menu items" : "Collapse menu items"}
          >
            {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </Button>
          <div className="relative flex-grow">
            <Input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {searchedMenuItems
            .filter(item => item.id && item.id.trim() !== '')
            .map((item) => {
              console.log("Rendering item:", item);
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-bold">{item.name}</CardTitle>
                      <div className="flex space-x-2">
                        <Button asChild size="icon" variant="ghost">
                          <Link
                            href={`/menu/edit?id=${item.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              console.log("Navigating to edit with ID:", item.id);
                              router.push(`/menu/edit?id=${item.id}`);
                            }}
                          >
                            <Edit size={16} />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteMenuItem(item.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!isCollapsed && (
                        <>
                          <div className="aspect-video relative mb-2">
                            <Image
                              src={item.image || '/placeholder.svg?height=100&width=100'}
                              alt={item.name}
                              layout="fill"
                              objectFit="cover"
                              className="rounded-md"
                            />
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                          <p className="font-bold text-sm mb-1">Base Price: ${parseFloat(item.basePrice).toFixed(2)}</p>
                          {item.sizes.length > 0 && (
                            <div className="mb-1 text-sm">
                              <p className="font-semibold">Sizes:</p>
                              <ul className="list-disc list-inside">
                                {item.sizes.map((size, index) => (
                                  <li key={index}>{size.name}: +${parseFloat(size.price).toFixed(2)}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {item.addOns.length > 0 && (
                            <div className="mb-1 text-sm">
                              <p className="font-semibold">Add-ons:</p>
                              <ul className="list-disc list-inside">
                                {item.addOns.map((addOn, index) => (
                                  <li key={index}>{addOn.name}: +${parseFloat(addOn.price).toFixed(2)}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="flex items-center justify-center h-full">
              <CardContent className="flex items-center justify-center w-full h-full p-6">
                <Link href="/menu/edit" className="w-full h-full flex items-center justify-center">
                  <Button variant="outline" className="w-full h-full aspect-video flex flex-col items-center justify-center">
                    <PlusCircle className="w-8 h-8 mb-1" />
                    <p className="text-sm">Add new menu item</p>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Category Modal */}
        <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label htmlFor="categoryName" className="block mb-2 text-sm font-medium">Category Name</label>
                <Input
                  id="categoryName"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label htmlFor="categoryDescription" className="block mb-2 text-sm font-medium">Description</label>
                <div className="relative">
                  <Textarea
                    id="categoryDescription"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-0 right-0"
                    onClick={async () => {
                      const generatedDescription = await generateCategoryDescription(newCategory.name);
                      setNewCategory(prev => ({ ...prev, description: generatedDescription }));
                    }}
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label htmlFor="categoryImage" className="block mb-2 text-sm font-medium">Image</label>
                <Input
                  id="categoryImage"
                  type="file"
                  onChange={handleCategoryImageUpload}
                  accept="image/*"
                />
                {newCategory.image && (
                  <div className="mt-2 relative">
                    <Image src={newCategory.image} alt="Category preview" width={300} height={200} className="rounded" />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => setNewCategory(prev => ({ ...prev, image: '' }))}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setShowCategoryModal(false)
                  setEditingCategory(null)
                  setNewCategory({ name: '', description: '', image: '' })
                }}>
                  Cancel
                </Button>
                <Button onClick={addOrUpdateCategory}>
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <ConfirmationDialog
          isOpen={showDeployConfirmation}
          onClose={() => setShowDeployConfirmation(false)}
          onConfirm={handleDeployConfirm}
          title="Deploy Menu"
          message="Are you sure you want to deploy the menu? This will make it live."
        />
      </div>
    </div>
  )
}