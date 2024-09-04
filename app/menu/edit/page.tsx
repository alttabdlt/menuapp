'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PlusCircle, X, Image as ImageIcon, Sparkles } from 'lucide-react'
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/Input"
import { Textarea } from "../../../components/ui/Textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/Select1"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Label } from "../../../components/ui/label"
import { ScrollArea } from "../../../components/ui/scroll-area"
import React from 'react'
import { toast } from "react-hot-toast"
import { AIAssistWrite } from '../../../components/AIAssistWrite'
import { db, storage, auth } from '../../../lib/firebase';
import { collection, addDoc, doc, updateDoc, getDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';
import { useMediaQuery } from 'react-responsive'
import Image from 'next/image';

type Size = {
  name: string;
  price: string;
}

type AddOn = {
  name: string;
  price: string;
}

type MenuItem = {
  id: string;
  name: string;
  description: string;
  basePrice: string;
  sizes: Size[];
  addOns: AddOn[];
  image: string;
  categoryId: string;
}

type Category = {
  id: string;
  name: string;
  description: string;
  dishes: string[];
  image: string;
}

const sizeOptions = ['Very Small', 'Small', 'Medium', 'Large', 'Very Large']

const sortSizes = (sizes: Size[]) => {
  const sizeOrder = {
    'Very Small': 1,
    'Small': 2,
    'Medium': 3,
    'Large': 4,
    'Very Large': 5,
  } as const;
  return sizes.sort((a, b) => sizeOrder[a.name as keyof typeof sizeOrder] - sizeOrder[b.name as keyof typeof sizeOrder]);
}

function EditMenuItemPage() {
  console.log("EditMenuItemPage component rendered");

  const router = useRouter()
  const searchParams = useSearchParams()
  const [id, setId] = useState<string | null>(null)
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1024px)' })

  useEffect(() => {
    console.log("Full URL:", window.location.href);
    console.log("SearchParams:", Object.fromEntries(searchParams.entries()));
    
    const getItemId = () => {
      const params = new URLSearchParams(window.location.search);
      return params.get('id');
    };

    const itemId = searchParams.get('id') || getItemId();
    console.log("Item ID:", itemId);
    
    if (itemId && itemId.trim() !== '') {
      console.log("Setting id:", itemId);
      setId(itemId);
      fetchItem(itemId);
    } else {
      console.log("No valid id found, initializing new item");
      setItem(prev => ({
        ...prev,
        addOns: [{ name: 'None', price: '0.00' }]
      }));
    }
  }, [searchParams]);

  const fetchItem = async (itemId: string) => {
    try {
      console.log("Fetching item with ID:", itemId);
      const itemRef = doc(db, 'menuItems', itemId);
      const itemSnap = await getDoc(itemRef);
      if (itemSnap.exists()) {
        const existingItem = itemSnap.data() as MenuItem;
        console.log("Fetched item:", existingItem);
        setItem({...existingItem, id: itemId});
        setRawBasePrice(existingItem.basePrice.toString());
        setSelectedCategories(existingItem.categoryId ? existingItem.categoryId.split(',') : []);
      } else {
        console.log("No such document!");
        setItem(prev => ({
          ...prev,
          addOns: [{ name: 'None', price: '0.00' }]
        }));
      }
    } catch (error) {
      console.error('Error fetching document:', error);
    }
  };

  const [item, setItem] = useState<MenuItem>({
    id: '',
    name: '',
    description: '',
    basePrice: '',
    sizes: [],
    addOns: [],
    image: '',
    categoryId: '',
  })
  const [rawBasePrice, setRawBasePrice] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [promptCount, setPromptCount] = useState(0)

  const generateDescription = async (name: string, image: string | null, count: number) => {
    try {
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, image, type: 'menuItem', count }),
      });
      const data = await response.json();
      return data.description;
    } catch (error) {
      console.error('Error generating description:', error);
      return '';
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setItem(prev => ({ ...prev, [name]: value }))
  }

  const handleBasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^\d*\.?\d*$/.test(value)) {
      setRawBasePrice(value)
      setItem(prev => ({ ...prev, basePrice: value }))
    }
  }

  const formatCurrency = (value: number) => {
    return value.toFixed(2)
  }

  const handleSizeChange = (index: number, field: 'name' | 'price', value: string) => {
    setItem(prev => {
      const updatedSizes = prev.sizes.map((size, i) => 
        i === index 
          ? { 
              ...size, 
              [field]: field === 'price' 
                ? (value === '' ? '' : value) 
                : value 
            } 
          : size
      )
      return { ...prev, sizes: sortSizes(updatedSizes) }
    })
  }

  const handleAddOnChange = (index: number, field: 'name' | 'price', value: string) => {
    setItem(prev => ({
      ...prev,
      addOns: prev.addOns.map((addOn, i) => 
        i === index 
          ? { 
              ...addOn, 
              [field]: field === 'price' 
                ? (addOn.name === 'None' ? '0.00' : (value === '' ? '' : value))
                : value 
            } 
          : addOn
      )
    }))
  }

  const addSize = () => {
    setItem(prev => {
      const updatedSizes = [...prev.sizes, { name: 'Medium', price: '' }]
      return { ...prev, sizes: sortSizes(updatedSizes) }
    })
  }

  const removeSize = (index: number) => {
    setItem(prev => {
      const updatedSizes = prev.sizes.filter((_, i) => i !== index)
      return { ...prev, sizes: sortSizes(updatedSizes) }
    })
  }

  const addAddOn = () => {
    setItem(prev => ({
      ...prev,
      addOns: prev.addOns[0]?.name === 'None'
        ? [{ name: '', price: '' }]
        : [...prev.addOns, { name: '', price: '' }]
    }))
  }

  const removeAddOn = (index: number) => {
    setItem(prev => {
      const newAddOns = prev.addOns.filter((_, i) => i !== index)
      return {
        ...prev,
        addOns: newAddOns.length === 0 ? [{ name: 'None', price: '0.00' }] : newAddOns
      }
    })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setItem(prev => ({ ...prev, image: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!item.name.trim()) newErrors.name = "Name is required"
    if (!rawBasePrice.trim() || isNaN(parseFloat(rawBasePrice))) newErrors.basePrice = "Valid base price is required"

    item.sizes.forEach((size, index) => {
      if (!size.name) newErrors[`size-${index}-name`] = "Size name is required"
      if (!size.price.trim() || isNaN(parseFloat(size.price))) newErrors[`size-${index}-price`] = "Valid price is required"
    })

    item.addOns.forEach((addOn, index) => {
      if (addOn.name !== 'None') {
        if (!addOn.name.trim()) newErrors[`addOn-${index}-name`] = "Add-on name is required"
        if (!addOn.price.trim() || isNaN(parseFloat(addOn.price))) newErrors[`addOn-${index}-price`] = "Valid price is required"
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const addMenuItem = async (newItem: MenuItem) => {
    try {
      const docRef = await addDoc(collection(db, 'menuItems'), newItem);
      const updatedItem = { ...newItem, id: docRef.id };
      await updateDoc(docRef, { id: docRef.id });
      console.log("Added item with ID:", docRef.id);
      return updatedItem;
    } catch (error) {
      console.error('Error adding menu item:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted");
    if (!validateForm()) {
      console.log("Form validation failed");
      toast.error("Please correct the errors before submitting");
      return;
    }

    const updatedItem = { 
      ...item, 
      basePrice: parseFloat(rawBasePrice) || 0, 
      categoryId: selectedCategories.join(','),
      addOns: item.addOns.length === 1 && item.addOns[0].name === 'None' 
        ? [] 
        : item.addOns.map(addOn => 
            addOn.name === 'None' ? { ...addOn, price: '0.00' } : addOn
          )
    };
    console.log("Updated item:", updatedItem);

    try {
      let itemRef;
      if (updatedItem.id) {
        itemRef = doc(db, 'menuItems', updatedItem.id);
        await updateDoc(itemRef, updatedItem);
      } else {
        const menuItemsCollection = collection(db, 'menuItems');
        const docRef = await addDoc(menuItemsCollection, updatedItem);
        updatedItem.id = docRef.id;
      }

      if (updatedItem.image && updatedItem.image.startsWith('data:')) {
        const imageRef = ref(storage, `menuItemImages/${updatedItem.id}`);
        await uploadString(imageRef, updatedItem.image, 'data_url');
        const imageUrl = await getDownloadURL(imageRef);
        await updateDoc(doc(db, 'menuItems', updatedItem.id), { image: imageUrl });
      }

      console.log("Item saved successfully");
      toast.success('Menu item saved successfully');
      router.push('/menu');
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error('Failed to save menu item. Please try again.');
    }
  };

  const handleDelete = async () => {
    const itemId = item.id || searchParams.get('id');
    console.log("Delete button clicked, itemId:", itemId);
    if (itemId && itemId.trim() !== '') {
      try {
        await deleteDoc(doc(db, 'menuItems', itemId));
        if (item.image) {
          const imageRef = ref(storage, `menuItemImages/${itemId}`);
          await deleteObject(imageRef);
        }
        toast.success('Menu item deleted successfully');
        router.push('/menu');
      } catch (error) {
        console.error('Error deleting menu item:', error);
        toast.error('Failed to delete menu item. Please try again.');
      }
    } else {
      console.error('No valid item ID for deletion');
      toast.error('Cannot delete item without a valid ID');
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesCollection = collection(db, 'categories');
        const categoriesSnapshot = await getDocs(categoriesCollection);
        const categoriesList: Category[] = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          description: '',
          dishes: [],
          image: ''
        }));
        setCategories(categoriesList);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories. Please try again.');
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold text-center">
            {item.id ? 'Edit Menu Item' : 'Add New Menu Item'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div>
              <Label htmlFor="name">Food Name</Label>
              <Input
                id="name"
                name="name"
                value={item.name}
                onChange={handleChange}
                required
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <div className="relative">
                <Textarea
                  id="description"
                  name="description"
                  value={item.description}
                  onChange={handleChange}
                  rows={3}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0"
                  onClick={async () => {
                    const generatedDescription = await generateDescription(item.name, item.image, promptCount);
                    setItem(prev => ({ ...prev, description: generatedDescription }));
                    setPromptCount(prev => prev + 1);
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="basePrice">Base Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                <Input
                  id="basePrice"
                  name="basePrice"
                  value={rawBasePrice}
                  onChange={handleBasePriceChange}
                  className="pl-6"
                  required
                />
              </div>
              {errors.basePrice && <p className="text-red-500 text-sm mt-1">{errors.basePrice}</p>}
              <p className="mt-1 text-sm text-muted-foreground">
                Formatted: ${formatCurrency(parseFloat(rawBasePrice) || 0)}
              </p>
            </div>
            <div>
              <Label>Sizes</Label>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                {item.sizes.map((size, index) => (
                  <div key={index} className="flex mb-4 space-x-2 p-2 border rounded-md">
                    <Select
                      value={size.name}
                      onValueChange={(value) => handleSizeChange(index, 'name', value)}
                    >
                      <SelectTrigger className="w-[120px] md:w-[180px]">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {sizeOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">$</span>
                      <Input
                        value={size.price}
                        onChange={(e) => handleSizeChange(index, 'price', e.target.value)}
                        placeholder="Additional price"
                        className="pl-5"
                      />
                    </div>
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeSize(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                    {errors[`size-${index}-name`] && <p className="text-red-500 text-sm">{errors[`size-${index}-name`]}</p>}
                    {errors[`size-${index}-price`] && <p className="text-red-500 text-sm">{errors[`size-${index}-price`]}</p>}
                  </div>
                ))}
              </ScrollArea>
              <Button type="button" onClick={addSize} className="mt-2 w-full md:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Size
              </Button>
            </div>
            <div>
              <Label>Add-Ons</Label>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                {item.addOns.map((addOn, index) => (
                  <div key={index} className="flex mb-4 space-x-2 p-2 border rounded-md">
                    <Input
                      value={addOn.name}
                      onChange={(e) => handleAddOnChange(index, 'name', e.target.value)}
                      placeholder="Add-on name"
                      className="flex-grow"
                      disabled={addOn.name === 'None'}
                    />
                    <div className="relative w-28">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">$</span>
                      <Input
                        value={addOn.price}
                        onChange={(e) => handleAddOnChange(index, 'price', e.target.value)}
                        placeholder="Price"
                        className="pl-5"
                        disabled={addOn.name === 'None'}
                      />
                    </div>
                    {addOn.name !== 'None' && (
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon" 
                        onClick={() => removeAddOn(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {errors[`addOn-${index}-name`] && <p className="text-red-500 text-sm">{errors[`addOn-${index}-name`]}</p>}
                    {errors[`addOn-${index}-price`] && <p className="text-red-500 text-sm">{errors[`addOn-${index}-price`]}</p>}
                  </div>
                ))}
              </ScrollArea>
              <Button 
                type="button" 
                onClick={addAddOn} 
                className="mt-2 w-full md:w-auto"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Add-on
              </Button>
            </div>
            <div>
              <Label htmlFor="image">Image</Label>
              <div className="flex items-center space-x-4">
                <Input
                  id="image"
                  name="image"
                  type="file"
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <Button asChild variant="outline" className="w-full">
                  <label htmlFor="image" className="cursor-pointer">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {item.image ? 'Change Image' : 'Attach Image'}
                  </label>
                </Button>
                {item.image && (
                  <div className="mt-2 relative">
                    <Image
                      src={item.image}
                      alt="Category preview"
                      width={300}
                      height={200}
                      className="rounded"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => setItem(prev => ({ ...prev, image: '' }))}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label>Categories</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {categories.map(category => (
                  <Button
                    key={category.id}
                    type="button"
                    variant={selectedCategories.includes(category.id) ? "default" : "outline"}
                    onClick={() => handleCategoryToggle(category.id)}
                    className="rounded-full"
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between pt-4 md:pt-6 space-y-2 md:space-y-0">
              <Button type="button" variant="outline" onClick={() => router.push('/menu')} className="w-full md:w-auto">
                Cancel
              </Button>
              {(id || searchParams.get('id')) && (
                <Button type="button" variant="destructive" onClick={handleDelete} className="w-full md:w-auto">
                  Delete Item
                </Button>
              )}
              <Button type="submit" className="w-full md:w-auto">
                {item.id ? 'Update Item' : 'Add Item'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default EditMenuItemPage