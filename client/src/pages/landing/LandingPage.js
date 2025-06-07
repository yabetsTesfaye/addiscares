import React, { useEffect, useRef, useState } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FiUsers, 
  FiAlertTriangle, 
  FiMapPin, 
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiArrowRight,
  FiShield,
  FiBell,
  FiBarChart2,
  FiHelpCircle,
  FiMessageSquare
} from 'react-icons/fi';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import HazardCarousel from '../../components/common/HazardCarousel';
import './LandingPage.css';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

const slideUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

const FeatureCard = ({ icon: Icon, title, description, delay }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={slideUp}
      transition={{ delay: delay * 0.1 }}
      whileHover={{ y: -5 }}
    >
      <Card className="h-100 border-0 bg-white shadow-sm rounded-3 feature-card">
        <Card.Body className="p-4">
          <div className="feature-icon mb-4">
            <div className="icon-wrapper">
              {React.cloneElement(Icon, { size: 24, className: 'text-primary' })}
            </div>
          </div>
          <h3 className="h5 fw-bold mb-3">{title}</h3>
          <p className="text-muted mb-0">
            {description}
          </p>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

const LandingPage = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const heroControls = useAnimation();
  const carouselRef = useRef(null);
  const [heroRef, heroInView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  useEffect(() => {
    if (heroInView) {
      heroControls.start('visible');
    }
  }, [heroControls, heroInView]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const scrollToCarousel = () => {
    carouselRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const stats = [
    { value: '10,000+', label: 'Reports Resolved', icon: <FiCheckCircle /> },
    { value: '5,000+', label: 'Active Users', icon: <FiUsers /> },
    { value: '25+', label: 'Neighborhoods', icon: <FiMapPin /> },
    { value: '24/7', label: 'Support', icon: <FiClock /> }
  ];

  const features = [
    {
      icon: <FiAlertTriangle />,
      title: 'Report Hazards',
      description: 'Easily report any hazards you encounter in your community.'
    },
    {
      icon: <FiMapPin />,
      title: 'Real-time Tracking',
      description: 'Track reported hazards in real-time on an interactive map.'
    },
    {
      icon: <FiUsers />,
      title: 'Community Driven',
      description: 'Join a community committed to making Addis Ababa safer.'
    },
    {
      icon: <FiTrendingUp />,
      title: 'Track Progress',
      description: 'Monitor the status of reported hazards and see the impact.'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Report an Issue',
      description: 'Take a photo and submit a report about any hazard or issue in your community.'
    },
    {
      number: '02',
      title: 'Authorities Notified',
      description: 'The appropriate city department is automatically alerted to address the issue.'
    },
    {
      number: '03',
      title: 'Issue Resolved',
      description: 'Track the progress and get notified when the issue is resolved.'
    }
  ];

  const testimonials = [
    {
      id: 1,
      content: 'AddisCare has transformed how we address community issues in Addis Ababa. The platform has significantly improved response times and increased citizen engagement.',
      author: 'Alemayehu Kebede',
      role: 'City Council Member',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    {
      id: 2,
      content: 'As a long-time resident, I\'ve seen how AddisCare has helped make our neighborhood cleaner and safer. The response from the city has been impressive!',
      author: 'Sara Mohammed',
      role: 'Community Leader',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    {
      id: 3,
      content: 'The transparency and ease of use of AddisCare make it an essential tool for every resident who cares about their community.',
      author: 'Yonas Tadesse',
      role: 'Local Business Owner',
      avatar: 'https://randomuser.me/api/portraits/men/22.jpg'
    }
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section ref={heroRef} className="hero-section position-relative overflow-hidden">
        <div className="hero-shape"></div>
        <Container className="position-relative">
          <motion.div
            initial="hidden"
            animate={heroControls}
            variants={staggerContainer}
            className="h-100"
          >
            <Row className="justify-content-center min-vh-100 py-5">
              <Col lg={8} className="text-center py-5">
                <motion.div variants={fadeIn}>
                  <motion.span 
                    className="badge bg-primary-soft text-primary px-3 py-2 mb-3 d-inline-flex align-items-center mx-auto"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <FiShield className="me-2" size={16} /> Making Addis Ababa Safer
                  </motion.span>
                  <motion.h1 
                    className="display-4 fw-bold mb-4"
                    variants={fadeIn}
                    transition={{ delay: 0.2 }}
                  >
                    Together, We Can Build a <span className="text-primary">Safer</span> Addis Ababa
                  </motion.h1>
                  <motion.p 
                    className="lead text-muted mb-5 mx-auto"
                    style={{ maxWidth: '700px' }}
                    variants={fadeIn}
                    transition={{ delay: 0.3 }}
                  >
                    Report hazards, track progress, and see real results in your community. 
                    Join thousands of citizens working to make our city cleaner and safer.
                  </motion.p>
                  <motion.div 
                    className="d-flex flex-column flex-sm-row gap-3 justify-content-center"
                    variants={fadeIn}
                    transition={{ delay: 0.4 }}
                  >
                    <Button 
                      as={Link} 
                      to="/register" 
                      variant="primary" 
                      size="lg" 
                      className="px-4 py-3 fw-semibold d-flex align-items-center mx-sm-0 mx-auto"
                    >
                      Get Started <FiArrowRight className="ms-2" size={18} />
                    </Button>
                    <Button 
                      variant="outline-primary" 
                      size="lg" 
                      className="px-4 py-3 fw-semibold d-flex align-items-center mx-sm-0 mx-auto"
                      onClick={scrollToCarousel}
                    >
                      <FiHelpCircle className="me-2" size={18} /> How It Works
                    </Button>
                  </motion.div>
                </motion.div>
              </Col>
            </Row>
          </motion.div>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="g-4">
            {stats.map((stat, index) => (
              <Col key={index} xs={6} md={3}>
                <motion.div 
                  className="text-center p-3"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <div className="stat-icon mb-2">
                    {React.cloneElement(stat.icon, { size: 28, className: 'text-primary' })}
                  </div>
                  <h3 className="display-5 fw-bold text-dark mb-1">{stat.value}</h3>
                  <p className="text-muted mb-0 small fw-medium text-uppercase letter-spacing-1">
                    {stat.label}
                  </p>
                </motion.div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-5 bg-white">
        <Container>
          <motion.div 
            className="text-center mb-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-uppercase text-primary fw-bold small d-inline-block mb-2">Features</span>
            <h2 className="display-5 fw-bold mb-4">How AddisCare Works</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
              Our platform makes it simple to report hazards and track their resolution. 
              Join thousands of citizens making a difference in Addis Ababa.
            </p>
          </motion.div>
          
          <Row className="g-4">
            {features.map((feature, index) => (
              <Col key={index} lg={3} md={6}>
                <FeatureCard 
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  delay={index}
                />
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-5 bg-light" ref={carouselRef}>
        <Container>
          <motion.div 
            className="text-center mb-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-uppercase text-primary fw-bold small d-inline-block mb-2">Process</span>
            <h2 className="display-5 fw-bold mb-4">Simple Steps to Make a Difference</h2>
          </motion.div>
          <Row className="g-4">
            {steps.map((step, index) => (
              <Col key={index} md={4}>
                <motion.div 
                  className="text-center p-4 h-100"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <div className="step-number mb-3">{step.number}</div>
                  <h4 className="h5 fw-bold mb-3">{step.title}</h4>
                  <p className="text-muted mb-0">
                    {step.description}
                  </p>
                </motion.div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Hazard Carousel Section */}
      <section id="hazard-carousel" className="py-5 bg-white">
        <Container>
          <motion.div 
            className="text-center mb-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-uppercase text-primary fw-bold small d-inline-block mb-2">Community Impact</span>
            <h2 className="display-5 fw-bold mb-4">Recent Reports in Addis Ababa</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
              See how AddisCare is helping to identify and resolve issues across the city.
              Each report brings us one step closer to a cleaner, safer Addis Ababa.
            </p>
          </motion.div>
          <HazardCarousel />
        </Container>
      </section>



      {/* Testimonial Section */}
      <section className="py-5 bg-primary text-white position-relative overflow-hidden">
        <div className="testimonial-shape"></div>
        <Container className="position-relative py-5">
          <motion.div 
            className="text-center mb-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <FiMessageSquare size={32} className="mb-3" />
            <h2 className="display-5 fw-bold mb-4">What Our Community Says</h2>
          </motion.div>
          
          <Row className="justify-content-center">
            <Col lg={8}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <blockquote className="blockquote mb-0">
                    <p className="h4 fw-light mb-4" style={{ lineHeight: '1.8' }}>
                      "{testimonials[currentTestimonial].content}"
                    </p>
                    <footer className="blockquote-footer text-white-80 mt-4">
                      <div className="d-flex flex-column align-items-center justify-content-center">
                        <div className="text-center">
                          <div className="fw-bold text-white">{testimonials[currentTestimonial].author}</div>
                          <div className="text-white-80">{testimonials[currentTestimonial].role}</div>
                        </div>
                      </div>
                    </footer>
                  </blockquote>
                </motion.div>
              </AnimatePresence>
              
              <div className="d-flex justify-content-center mt-4">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    className={`btn btn-sm rounded-circle mx-1 ${currentTestimonial === index ? 'bg-white' : 'bg-white-20'}`}
                    style={{
                      width: '12px',
                      height: '12px',
                      padding: 0,
                      border: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => setCurrentTestimonial(index)}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Call to Action */}
      <section className="py-5 bg-white">
        <Container>
          <motion.div 
            className="bg-primary-soft rounded-4 p-5 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="display-5 fw-bold mb-4">Ready to Make a Difference?</h2>
            <p className="lead mb-5 mx-auto" style={{ maxWidth: '600px' }}>
              Join thousands of citizens working together to create a cleaner, 
              safer Addis Ababa for everyone. Your report matters!
            </p>
            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
              <Button 
                as={Link} 
                to="/register" 
                variant="primary" 
                size="lg" 
                className="px-4 py-3 fw-semibold d-flex align-items-center"
              >
                Get Started <FiArrowRight className="ms-2" size={18} />
              </Button>
              <Button 
                as={Link} 
                to="/login" 
                variant="outline-primary" 
                size="lg" 
                className="px-4 py-3 fw-semibold"
              >
                Already a member? Sign In
              </Button>
            </div>
            <p className="small text-muted mt-3 mb-0">
              Join our community of active citizens making a difference every day.
            </p>
          </motion.div>
        </Container>
      </section>
    </div>
  );
};

export default LandingPage;
