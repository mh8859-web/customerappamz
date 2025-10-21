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

  const productsToInclude = products.filter(p => selectedProducts[p.id]);
  const subtotal = productsToInclude.reduce((sum, p) => sum + p.cost * p.quantity, 0);
  const tax = subtotal * 0.18; // Assuming 18% tax
  const total = subtotal + tax;

  const generatePOHTML = () => {
    const productRows = productsToInclude.map(p => `
      <tr class="border-b">
        <td class="p-3">${p.name}</td>
        <td class="p-3">${p.supplier}</td>
        <td class="p-3 text-center">${p.quantity}</td>
        <td class="p-3 text-right">₹${p.cost.toLocaleString()}</td>
        <td class="p-3 text-right">₹${(p.cost * p.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Purchase Order - ${project.title}</title>
          <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-100 font-sans p-8">
          <div class="max-w-4xl mx-auto bg-white p-12 rounded-lg shadow-lg">
              <div class="flex justify-between items-start mb-8 border-b pb-6">
                  <div>
                      <img src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" alt="AMAZ Logo" class="h-12 mb-4"/>
                      <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Purchase Order</h2>
                  </div>
                  <div class="text-right">
                      <h1 class="text-3xl font-bold text-gray-800">PO #${Date.now().toString().slice(-6)}</h1>
                      <p class="text-gray-500">Date: ${new Date().toLocaleDateString()}</p>
                  </div>
              </div>
              <div class="mb-8">
                <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Project Details</h2>
                <p class="font-bold text-gray-800">${project.title}</p>
                <p class="text-gray-600">${project.address}</p>
              </div>
              <table class="w-full text-left text-sm">
                  <thead class="bg-gray-50">
                      <tr>
                          <th class="p-3 font-semibold text-gray-600 uppercase">Item</th>
                          <th class="p-3 font-semibold text-gray-600 uppercase">Supplier</th>
                          <th class="p-3 font-semibold text-gray-600 uppercase text-center">Qty</th>
                          <th class="p-3 font-semibold text-gray-600 uppercase text-right">Unit Cost</th>
                          <th class="p-3 font-semibold text-gray-600 uppercase text-right">Total</th>
                      </tr>
                  </thead>
                  <tbody>${productRows}</tbody>
              </table>
              <div class="flex justify-end mt-8">
                <div class="w-full max-w-xs text-right text-sm">
                    <div class="flex justify-between py-1"><span class="text-gray-600">Subtotal:</span> <span class="font-medium text-gray-800">₹${subtotal.toLocaleString()}</span></div>
                    <div class="flex justify-between py-1"><span class="text-gray-600">Tax (18%):</span> <span class="font-medium text-gray-800">₹${tax.toLocaleString()}</span></div>
                    <div class="flex justify-between py-2 border-t mt-2 font-bold text-lg text-gray-800"><span>Total:</span> <span>₹${total.toLocaleString()}</span></div>
                </div>
              </div>
          </div>
      </body>
      </html>
    `;
  };

  const handleGenerate = () => {
    const poHtml = generatePOHTML();
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(poHtml);
    printWindow?.document.close();
    setTimeout(() => printWindow?.print(), 500); // Allow time for styles to load
    onClose();
  };

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
          <Button onClick={handleGenerate} disabled={productsToInclude.length === 0}>Generate & Print PO</Button>
        </div>
      </div>
    </Modal>
  );
};

export default GeneratePOModal;