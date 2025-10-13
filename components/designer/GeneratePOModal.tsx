import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Product, Project } from '../../types';

interface GeneratePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  project: Project;
}

const GeneratePOModal: React.FC<GeneratePOModalProps> = ({ isOpen, onClose, products, project }) => {
  const [selectedProducts, setSelectedProducts] = useState<Record<string, boolean>>({});

  const handleToggleProduct = (productId: string) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const handleGenerate = () => {
    alert("Purchase Order generated! (This would be a PDF download in a real application).");
    onClose();
  };

  const productsToInclude = products.filter(p => selectedProducts[p.id]);
  const subtotal = productsToInclude.reduce((sum, p) => sum + p.cost * p.quantity, 0);
  const tax = subtotal * 0.18; // Assuming 18% tax
  const total = subtotal + tax;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Generate Purchase Order for ${project.title}`}>
      <div>
        <h3 className="text-md font-semibold text-text-headline mb-2">Select Products to Include</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto bg-primary-bg p-2 rounded-lg border border-border-color">
          {products.map(product => (
            <label key={product.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-surface cursor-pointer">
              <input
                type="checkbox"
                checked={!!selectedProducts[product.id]}
                onChange={() => handleToggleProduct(product.id)}
                className="form-checkbox h-5 w-5 rounded bg-surface border-border-color text-accent focus:ring-accent"
              />
              <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-md object-cover" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-headline">{product.name}</p>
                <p className="text-xs text-text-muted">{product.supplier}</p>
              </div>
              <p className="text-sm font-mono text-text-headline">₹{(product.cost * product.quantity).toLocaleString()}</p>
            </label>
          ))}
        </div>
        
        {productsToInclude.length > 0 && (
            <div className="mt-4 border-t border-border-color pt-4 text-sm">
                <h3 className="text-md font-semibold text-text-headline mb-2">Summary</h3>
                <div className="space-y-1">
                    <div className="flex justify-between"><span>Subtotal:</span> <span>₹{subtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Tax (18%):</span> <span>₹{tax.toLocaleString()}</span></div>
                    <div className="flex justify-between font-bold text-text-headline text-base mt-1"><span>Total:</span> <span>₹{total.toLocaleString()}</span></div>
                </div>
            </div>
        )}

        <div className="flex justify-end pt-6 gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={productsToInclude.length === 0}>Generate PO</Button>
        </div>
      </div>
    </Modal>
  );
};

export default GeneratePOModal;
