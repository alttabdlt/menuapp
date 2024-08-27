'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MenuItem, CartItem } from '../app/types/database';

export const log = (message: string) => {
  const logs = JSON.parse(localStorage.getItem('debugLogs') || '[]');
  logs.push(`${new Date().toISOString()}: ${message}`);
  localStorage.setItem('debugLogs', JSON.stringify(logs));
  console.log(`Log: ${message}`);
};

type CartContextType = {
    cart: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    calculateTotal: () => number;
    proceedToCheckout: () => void; // New function
  };

const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  useEffect(() => {
    try {
      const cartString = JSON.stringify(cart);
      if (cartString.length <= MAX_STORAGE_SIZE) {
        localStorage.setItem('cart', cartString);
      } else {
        console.warn('Cart size exceeds localStorage limit. Using in-memory storage only.');
        // Optionally, you can implement a fallback storage method here
      }
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart(prevCart => [...prevCart, item]);
  };

  const removeFromCart = (id: string) => {
    setCart(prevCart => {
      const index = prevCart.findIndex(item => item.id === id);
      if (index !== -1) {
        const newCart = [...prevCart];
        newCart.splice(index, 1);
        return newCart;
      }
      return prevCart;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === id ? { ...item, quantity: quantity } : item
      ).filter(item => item.quantity > 0)
    );
  };

  const clearCart = () => {
    log('Clearing cart');
    setCart([]);
    localStorage.removeItem('cart');
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      let itemTotal = parseFloat(item.basePrice) * item.quantity;
      if (item.selectedSize) {
        itemTotal += parseFloat(item.selectedSize.price) * item.quantity;
      }
      item.selectedAddOns.forEach(addOn => {
        itemTotal += parseFloat(addOn.price) * item.quantity;
      });
      return total + itemTotal;
    }, 0);
  };

  const proceedToCheckout = () => {
    if (cart.length === 0) {
      alert("Your cart is empty. Add some items before checking out.");
      return;
    }
    
    // Here you would typically navigate to the checkout page
    // For now, we'll just log the action and clear the cart
    log('Proceeding to checkout');
    console.log('Cart contents:', cart);
    console.log('Total:', calculateTotal());
    
    // Clear the cart after "checkout"
    clearCart();
    
    // In a real application, you would navigate to a checkout page here
    // For example, if using Next.js:
    // router.push('/checkout');
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, calculateTotal, proceedToCheckout }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};