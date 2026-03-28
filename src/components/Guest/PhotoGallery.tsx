import { useEffect, useRef, useState } from 'react';

interface PhotoGalleryProps {
  photos: string[];
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visiblePhotos, setVisiblePhotos] = useState<boolean[]>(Array(photos.length).fill(false));

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisiblePhotos(Array(photos.length).fill(true));
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [photos.length]);

  if (photos.length === 0) return null;

  return (
    <div
      ref={sectionRef}
      className="min-h-screen flex items-center justify-center px-4 py-16 sm:py-20 bg-gradient-to-br from-white via-amber-50 to-white"
    >
      <div className="max-w-5xl w-full">
        <p className="text-center text-gray-600 text-xs sm:text-sm uppercase tracking-[0.2em] mb-8 sm:mb-12 font-light">
          Moments to Remember
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-6">
          {photos.map((photo, index) => (
            <div
              key={index}
              className={`relative h-40 sm:h-64 rounded-2xl overflow-hidden shadow-lg group transition-all duration-1000 transform ${
                visiblePhotos[index]
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-95'
              }`}
              style={{
                transitionDelay: `${index * 100}ms`,
              }}
            >
              <img
                src={photo}
                alt={`Memory ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
