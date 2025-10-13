import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Product } from '../../types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (product: Omit<Product, 'id' | 'projectId'>) => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    supplier: '',
    imageUrl: '',
    cost: '',
    quantity: '1',
    status: 'Pending' as Product['status'],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...formData,
      cost: parseFloat(formData.cost),
      quantity: parseInt(formData.quantity, 10),
    });
  };
  
  const inputClasses = "w-full bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-accent";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Product to Sourcing List">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-headline mb-1">Product Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClasses} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-text-headline mb-1">Supplier</label>
                <input type="text" name="supplier" value={formData.supplier} onChange={handleChange} className={inputClasses} />
            </div>
             <div>
                <label className="block text-sm font-medium text-text-headline mb-1">Image URL</label>
                <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleChange} className={inputClasses} placeholder="https://..." />
            </div>
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-text-headline mb-1">Cost per Item (₹)</label>
                <input type="number" name="cost" value={formData.cost} onChange={handleChange} className={inputClasses} required />
            </div>
             <div>
                <label className="block text-sm font-medium text-text-headline mb-1">Quantity</label>
                <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className={inputClasses} required />
            </div>
        </div>
        <div className="flex justify-end pt-4 gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add Product</Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddProductModal;