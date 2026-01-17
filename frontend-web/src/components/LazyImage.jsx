// Composant pour le lazy loading des images
// Améliore les performances de chargement

import React, { useState, useRef, useEffect } from 'react';

function LazyImage({ src, alt, placeholder, ...props }) {
  const [imageSrc, setImageSrc] = useState(placeholder || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E');
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    let observer;
    const currentImg = imgRef.current;

    if (currentImg && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              setIsLoaded(true);
              observer.unobserve(currentImg);
            }
          });
        },
        {
          rootMargin: '50px', // Commencer à charger 50px avant que l'image soit visible
        }
      );

      observer.observe(currentImg);
    } else {
      // Fallback pour les navigateurs sans IntersectionObserver
      setImageSrc(src);
      setIsLoaded(true);
    }

    return () => {
      if (observer && currentImg) {
        observer.unobserve(currentImg);
      }
    };
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      style={{
        opacity: isLoaded ? 1 : 0.5,
        transition: 'opacity 0.3s',
        ...props.style,
      }}
      onLoad={() => setIsLoaded(true)}
      {...props}
    />
  );
}

export default LazyImage;


