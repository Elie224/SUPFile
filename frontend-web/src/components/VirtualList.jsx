// Composant de virtual scrolling pour les longues listes
// Améliore les performances en ne rendant que les éléments visibles

import React, { useState, useEffect, useRef, useMemo } from 'react';

function VirtualList({ 
  items = [], 
  itemHeight = 50, 
  containerHeight = 400,
  renderItem,
  overscan = 5, // Nombre d'éléments à rendre en dehors de la zone visible
  ...props 
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Calculer les indices visibles
  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Éléments à rendre
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1).map((item, index) => ({
      ...item,
      index: visibleRange.start + index,
    }));
  }, [items, visibleRange.start, visibleRange.end]);

  // Hauteur totale de la liste
  const totalHeight = items.length * itemHeight;

  // Offset pour le conteneur interne
  const offsetY = visibleRange.start * itemHeight;

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: containerHeight,
        overflow: 'auto',
        ...props.style,
      }}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item) => (
            <div
              key={item.id || item.index}
              style={{
                height: itemHeight,
              }}
            >
              {renderItem(item, item.index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VirtualList;

