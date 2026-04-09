import React, { useState, useRef, useEffect } from "react";

export default function AnimatedGallery() {
  const [images] = useState([
    { id: 1, alt: "Deep Tech Event", emoji: "/team1.jpg" },
    { id: 2, alt: "Team Photo", emoji: "/7.png" },
    { id: 3, alt: "Conference Hall", emoji: "/team1.jpg" },
    { id: 4, alt: "Tech Summit", emoji: "/team1.jpg" },
    { id: 5, alt: "Group Discussion", emoji: "/team1.jpg" },
    { id: 0, alt: "Award Ceremony", emoji: "/team1.jpg" },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef(null);

  // Create infinite loop array
  const infiniteImages = [...images, ...images, ...images];
  const centerIndex = images.length; // Start at middle set

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX);
    setDragOffset(0);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const diff = e.pageX - startX;
    setDragOffset(diff);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Determine if we should move to next/prev based on drag distance
    if (Math.abs(dragOffset) > 100) {
      if (dragOffset > 0) {
        // Dragged right, go to previous
        setCurrentIndex((prev) => prev - 1);
      } else {
        // Dragged left, go to next
        setCurrentIndex((prev) => prev + 1);
      }
    }
    setDragOffset(0);
  };
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX);
    setDragOffset(0);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const diff = e.touches[0].pageX - startX;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (Math.abs(dragOffset) > 100) {
      if (dragOffset > 0) {
        setCurrentIndex((prev) => prev - 1);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }
    setDragOffset(0);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  // Handle infinite loop
  useEffect(() => {
    if (currentIndex < -images.length) {
      setCurrentIndex(currentIndex + images.length);
    } else if (currentIndex >= images.length) {
      setCurrentIndex(currentIndex - images.length);
    }
  }, [currentIndex, images.length]);

  const getImageStyle = (index) => {
    const position = index - (centerIndex + currentIndex);
    const offset =
      position * 60 + (isDragging ? (dragOffset / window.innerWidth) * 100 : 0);

    let opacity = 0.3;
    let scale = 0.85;
    let zIndex = 0;
    let blur = 4;

    // On mobile, only center image is fully visible
    if (window.innerWidth <= 768) {
      if (position === 0) {
        opacity = 1;
        scale = 1;
        zIndex = 10;
        blur = 0;
      } else {
        return { display: "none" };
      }
    } else {
      if (Math.abs(position) <= 1) {
        if (position === 0) {
          opacity = 1;
          scale = 1;
          zIndex = 10;
          blur = 0;
        } else {
          opacity = 0.4;
          scale = 0.85;
          zIndex = 5;
          blur = 2;
        }
      }
    }

    return {
      transform: `translateX(${offset}%) scale(${scale})`,
      opacity,
      zIndex,
      filter: `blur(${blur}px)`,
      transition: isDragging
        ? "none"
        : "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), filter 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
    };

  };

  const goToNext = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => prev - 1);
  };

  return (
    <div className="h-screen md:h-screen w-full pt-[50px] md:pt-40 overflow-hidden">
      <div className="w-full max-w-7xl">
        <div className="relative  flex items-center justify-center">
          {/* Images Container */}
          <div
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className={`
    relative w-full h-full
    ${isDragging ? "cursor-grabbing" : "cursor-grab"}
    select-none
  `}
          >
            {infiniteImages.map((image, index) => {
              const style = getImageStyle(index);
              const position = index - (centerIndex + currentIndex);

              // Only render visible images (center and adjacent)
              if (Math.abs(position) > 2) return null;

              return (
                <div
                  key={`${image.id}-${index}`}
                  className="absolute md:left-[250px] md:top-0 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[600px] "
                  style={style}
                >
                  <div className="w-full h-screen rounded-2xl overflow-hidden shadow-2xl bg-slate-700/50 backdrop-blur-sm border-2 border-slate-600/30">
                    <div className="w-full h-full flex items-center justify-center relative">
                      <img
                        draggable="false"
                        className="cursor-default"
                        src={image.emoji}
                        alt={image.alt}
                      />

                      {/* Center image highlight */}
                      {position === 1 && (
                        <div className="absolute inset-0 border-2 border-amber-400/50 rounded-2xl pointer-events-none" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}