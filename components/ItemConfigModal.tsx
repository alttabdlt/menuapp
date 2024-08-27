import React, { useState } from 'react';
import { X, Minus, Plus } from 'lucide-react';
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

type ItemConfigModalProps = {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (item: MenuItem, addOns: { name: string; price: string }[], quantity: number, note: string, size?: { name: string; price: string }) => void;
};

const ItemConfigModal: React.FC<ItemConfigModalProps> = ({ item, onClose, onAddToCart }) => {
  const [selectedSize, setSelectedSize] = useState<{ name: string; price: string } | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<{ name: string; price: string }[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  const totalPrice = () => {
    const basePrice = parseFloat(item.basePrice);
    const sizePrice = selectedSize ? parseFloat(selectedSize.price) : 0;
    const addOnsPrice = selectedAddOns.reduce((sum, addOn) => sum + parseFloat(addOn.price), 0);
    return (basePrice + sizePrice + addOnsPrice) * quantity;
  };

  const handleAddToCart = () => {
    onAddToCart(item, selectedAddOns, quantity, note, selectedSize || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">{item.name}</h2>
        <Image
          src={item.image || '/placeholder.svg'}
          alt={item.name}
          width={300}
          height={200}
          className="w-full h-48 object-cover rounded-md mb-4"
        />
        <p className="text-gray-600 mb-4">{item.description}</p>
        
        {item.sizes.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Size</h3>
            {item.sizes.map((size) => (
              <button
                key={size.name}
                onClick={() => setSelectedSize(size)}
                className={`mr-2 mb-2 px-3 py-1 rounded ${
                  selectedSize === size ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
              >
                {size.name} (+${parseFloat(size.price).toFixed(2)})
              </button>
            ))}
          </div>
        )}
        
        {item.addOns && item.addOns.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Add-ons</h3>
            {item.addOns.map((addOn) => (
              <button
                key={addOn.name}
                onClick={() => {
                  if (selectedAddOns.includes(addOn)) {
                    setSelectedAddOns(selectedAddOns.filter((a) => a !== addOn));
                  } else {
                    setSelectedAddOns([...selectedAddOns, addOn]);
                  }
                }}
                className={`mr-2 mb-2 px-3 py-1 rounded ${
                  selectedAddOns.includes(addOn) ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
              >
                {addOn.name} (+${parseFloat(addOn.price).toFixed(2)})
              </button>
            ))}
          </div>
        )}

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Quantity</h3>
          <div className="flex items-center">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1 bg-gray-200 rounded">-</button>
            <span className="mx-4">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-1 bg-gray-200 rounded">+</button>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Special Instructions</h3>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Any special requests?"
          />
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold">Total:</span>
          <span className="font-bold text-xl">${totalPrice().toFixed(2)}</span>
        </div>

        <div className="flex justify-end">
          <button onClick={onClose} className="mr-2 px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button onClick={handleAddToCart} className="px-4 py-2 bg-blue-500 text-white rounded">Add to Cart</button>
        </div>
      </div>
    </div>
  );
};

export default ItemConfigModal;