import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';
import { PackageIcon, DollarSignIcon, BuildingOffice2Icon } from '../../components/icons';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
    <Card className="flex items-center p-5">
        <div className={`p-3 rounded-xl`} style={{ backgroundColor: `${color}20`, color }}>
           {icon}
        </div>
        <div className="ml-4">
            <p className="text-sm text-text-secondary font-medium">{title}</p>
            <p className="text-2xl font-bold font-display text-text-primary">{value}</p>
        </div>
    </Card>
);

const ProductionHeadDashboard: React.FC = () => {
    const { projects, products, loading: dataLoading } = useData();

    const totalSourcedValue = products.reduce((sum, p) => sum + (p.cost * p.quantity), 0);
    const uniqueSuppliers = new Set(products.map(p => p.supplier)).size;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-display text-text-primary">Production Head Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Sourced Value" value={`₹${totalSourcedValue.toLocaleString()}`} color="#00BA7C" icon={<DollarSignIcon className="w-6 h-6" />} />
                <StatCard title="Active Projects" value={projects.filter(p => p.status === 'Active').length} color="#1D9BF0" icon={<PackageIcon className="w-6 h-6" />} />
                <StatCard title="Total Suppliers" value={uniqueSuppliers} color="#F97316" icon={<BuildingOffice2Icon className="w-6 h-6" />} />
            </div>

            <Card>
                <h2 className="text-xl font-semibold font-display text-text-primary mb-4">Master Sourcing List</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-text-secondary uppercase bg-page-bg">
                            <tr>
                                <th className="px-4 py-3">Product</th>
                                <th className="px-4 py-3">Project</th>
                                <th className="px-4 py-3">Supplier</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Total Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => {
                                const project = projects.find(p => p.id === product.projectId);
                                return (
                                    <tr key={product.id} className="border-t border-border-color">
                                        <td className="px-4 py-3 font-medium text-text-primary">{product.name}</td>
                                        <td className="px-4 py-3"><Link to={`/projects/${project?.id}`} className="hover:underline text-brand-blue">{project?.title}</Link></td>
                                        <td className="px-4 py-3">{product.supplier}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                product.status === 'Delivered' ? 'bg-green-500/20 text-green-400' :
                                                product.status === 'Ordered' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>{product.status}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">₹{(product.cost * product.quantity).toLocaleString()}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    {products.length === 0 && <div className="text-center py-8 text-text-secondary">No products have been sourced yet.</div>}
                </div>
            </Card>
        </div>
    );
};

export default ProductionHeadDashboard;
