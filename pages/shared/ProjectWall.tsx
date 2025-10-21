import React from 'react';
import Card from '../../components/ui/Card';
import { PhotoIcon } from '../../components/icons';
import { useData } from '../../context/DataContext';

const ProjectWall: React.FC = () => {
  const { finalGalleryImages, projects, loading } = useData();

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-display text-text-primary">Project Wall</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-xl"></div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-display text-text-primary">Project Wall</h1>
      {finalGalleryImages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {finalGalleryImages.map(image => {
                const project = projects.find(p => p.id === image.projectId);
                return (
                    <div key={image.id} className="group relative aspect-square overflow-hidden rounded-xl">
                        <img src={image.url} alt={image.caption} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-4 text-white">
                            <h3 className="font-bold">{project?.title}</h3>
                            <p className="text-xs">{image.caption}</p>
                        </div>
                    </div>
                )
            })}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <PhotoIcon className="w-16 h-16 text-text-secondary mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-text-primary">The Gallery is Empty</h2>
            <p className="text-text-secondary mt-2">
              As projects are completed and final photos are added, they will appear here.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProjectWall;