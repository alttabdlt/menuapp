import React from 'react';
import { ShoppingCart, X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

type MenuItem = {
  id: string;
  name: string;
  description: string;
  basePrice: string;
  sizes: { name: string; price: string }[];
  addOns: { name: string; price: string }[];
  image: string;
}

type CartItem = MenuItem & {
  quantity: number;
  selectedSize?: { name: string; price: string };
  selectedAddOns: { name: string; price: string }[];
}

type CartDropdownProps = {
  cart: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveItem: (index: number) => void;
};

const CartDropdown: React.FC<CartDropdownProps> = ({ cart, isOpen, onClose, onRemoveItem }) => {
  if (!isOpen) return null;

  const calculateItemTotal = (item: CartItem) => {
    let total = parseFloat(item.basePrice);
    if (item.selectedSize) {
      total += parseFloat(item.selectedSize.price);
    }
    item.selectedAddOns.forEach(addOn => {
      total += parseFloat(addOn.price);
    });
    return total * item.quantity;
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-10 max-h-[80vh] overflow-y-auto">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Order Summary</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        {cart.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <>
            {cart.map((item, index) => (
              <div key={index} className="mb-4 pb-4 border-b">
                <div className="flex items-start">
                  <Image src={item.image || '/placeholder.svg'} alt={item.name} width={80} height={80} className="rounded-md mr-4 object-cover" />
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">{item.quantity}x</span> {item.name}
                        <button className="text-blue-500 text-sm ml-2">Edit</button>
                      </div>
                      <button onClick={() => onRemoveItem(index)} className="text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {item.selectedSize && (
                      <p className="text-sm text-gray-600">Size: {item.selectedSize.name}</p>
                    )}
                    {item.selectedAddOns.length > 0 && (
                      <p className="text-sm text-gray-600">
                        Add-ons: {item.selectedAddOns.map(addOn => addOn.name).join(', ')}
                      </p>
                    )}
                    <p className="text-sm font-semibold mt-1">${calculateItemTotal(item).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center font-semibold">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
            <Link href="/checkout" className="block w-full text-center bg-green-500 text-white py-2 rounded-lg mt-4 hover:bg-green-600 transition-colors">
              Place Order
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default CartDropdown;