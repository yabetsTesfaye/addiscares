import React, { useState, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';
import { Container } from 'react-bootstrap';
import { FaMapMarkerAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { RiAlertFill } from 'react-icons/ri';
import './HazardCarousel.css';

const hazardImages = [
  {
    url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    title: 'Bole Road Construction',
    description: 'Ongoing road construction projects in Bole area',
    location: 'Bole, Addis Ababa',
    category: 'Infrastructure'
  },
  {
    url: 'https://images.unsplash.com/photo-1581430871103-9781dc1e76e6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    title: 'Mercato Market Area',
    description: 'Busy streets of Merkato, Africa\'s largest open-air market',
    location: 'Merkato, Addis Ababa',
    category: 'Public Space'
  },
  {
    url: 'https://images.unsplash.com/photo-1601584115226-4e5f8d4c3b3d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    title: 'Unity Park',
    description: 'Newly developed recreational area in the heart of the city',
    location: 'Arat Kilo, Addis Ababa',
    category: 'Public Space'
  },
  {
    url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    title: 'Light Rail Transit',
    description: 'Addis Ababa\'s modern light rail system connecting key areas',
    location: 'Megenagna, Addis Ababa',
    category: 'Transportation'
  },
  {
    url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    title: 'Entoto Mountain View',
    description: 'Panoramic view of Addis Ababa from Entoto Mountain',
    location: 'Entoto, Addis Ababa',
    category: 'Environment'
  }
];

const HazardCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  
  const [ref, inView] = useInView({
    threshold: 0.2,
    triggerOnce: false
  });

  // Auto-rotate the carousel
  useEffect(() => {
    if (!inView || isHovered) return;
    
    const interval = setInterval(() => {
      setDirection(1);
      setActiveIndex(prev => (prev + 1) % hazardImages.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [inView, isHovered]);

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  const navigate = (newDirection) => {
    setDirection(newDirection);
    setActiveIndex(prev => (prev + newDirection + hazardImages.length) % hazardImages.length);
  };

  const goToSlide = (index) => {
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
  };

  return (
    <section className="hazard-carousel-section py-5" ref={ref}>
      <Container>
        <div className="section-header mb-5">
          <RiAlertFill className="section-icon" />
          <h2>Reported Hazards in Addis Ababa</h2>
          <p className="section-subtitle">Stay informed about potential hazards in your area</p>
        </div>
        
        <div 
          className="hazard-carousel-container"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="carousel-arrow left" onClick={() => navigate(-1)}>
            <FaChevronLeft />
          </div>
          
          <div className="hazard-carousel-track">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={activeIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className="hazard-slide"
              >
                <div className="hazard-image-container">
                  <div className="image-wrapper">
                    <img 
                      src={hazardImages[activeIndex].url} 
                      alt={hazardImages[activeIndex].title} 
                      className="hazard-image"
                      loading="lazy"
                    />
                    <div className="gradient-overlay" />
                  </div>
                  
                  <div className="hazard-overlay">
                    <div className="category-badge">
                      {hazardImages[activeIndex].category}
                    </div>
                    <div className="overlay-content">
                      <h3>{hazardImages[activeIndex].title}</h3>
                      <p>{hazardImages[activeIndex].description}</p>
                      <div className="location-tag">
                        <FaMapMarkerAlt className="location-icon" />
                        <span>{hazardImages[activeIndex].location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          <div className="carousel-arrow right" onClick={() => navigate(1)}>
            <FaChevronRight />
          </div>
          
          <div className="carousel-indicators">
            {hazardImages.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === activeIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};

export default HazardCarousel;
