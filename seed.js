const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const Report = require('./models/Report');
const Notification = require('./models/Notification');

// Load environment variables
dotenv.config();

// Sample data
const LOCATIONS = [
  { name: 'Bole Road', coordinates: { lat: 8.9972, lng: 38.7989 } },
  { name: 'Meskel Square', coordinates: { lat: 9.0189, lng: 38.7618 } },
  { name: 'Piazza', coordinates: { lat: 9.0360, lng: 38.7587 } },
  { name: 'Megenagna', coordinates: { lat: 9.0522, lng: 38.7650 } },
  { name: 'CMC', coordinates: { lat: 9.0219, lng: 38.7863 } },
  { name: 'Kazanchis', coordinates: { lat: 9.0227, lng: 38.7618 } },
  { name: 'Saris', coordinates: { lat: 9.0407, lng: 38.8089 } },
  { name: 'Gotera', coordinates: { lat: 9.0019, lng: 38.8009 } },
  { name: 'Megenagna', coordinates: { lat: 9.0522, lng: 38.7650 } },
  { name: 'Kality', coordinates: { lat: 8.9408, lng: 38.7258 } }
];

// Valid categories from Report model
const CATEGORIES = [
  'road', 'building', 'environment', 'public_service', 'other'
];

const STATUSES = ['pending', 'in_progress', 'resolved', 'rejected'];

const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Report.deleteMany({});
    await Notification.deleteMany({});

    console.log('Cleared existing data');

    // Create hashed password for all users
    const hashedPassword = await bcrypt.hash('password123', 10);
    const now = new Date();

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@addiscare.com',
      password: hashedPassword,
      phone: '+251911223344',
      address: 'Addis Ababa',
      role: 'admin',
      status: 'active',
      createdAt: now,
      updatedAt: now
    });

    // Create government officials
    const govtOfficials = await User.insertMany([
      {
        name: 'Alemnesh Kebede',
        email: 'alemn.kebede@addiscare.com',
        password: hashedPassword,
        phone: '+251911223345',
        address: 'Bole, Addis Ababa',
        role: 'government',
        department: 'Public Works',
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Tewodros Assefa',
        email: 'tewodros.a@addiscare.com',
        password: hashedPassword,
        phone: '+251911223346',
        address: 'Kazanchis, Addis Ababa',
        role: 'government',
        department: 'Sanitation',
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Selamawit Girma',
        email: 'selam.girma@addiscare.com',
        password: hashedPassword,
        phone: '+251911223347',
        address: 'Piazza, Addis Ababa',
        role: 'government',
        department: 'Electricity',
        status: 'active',
        createdAt: now,
        updatedAt: now
      }
    ]);

    // Create reporter users
    const reporters = await User.insertMany([
      {
        name: 'Dawit Mekonnen',
        email: 'dawit.m@addiscare.com',
        password: hashedPassword,
        phone: '+251911223348',
        address: 'Megenagna, Addis Ababa',
        role: 'reporter',
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Hirut Abebe',
        email: 'hirut.a@addiscare.com',
        password: hashedPassword,
        phone: '+251911223349',
        address: 'CMC, Addis Ababa',
        role: 'reporter',
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Yohannes Tesfaye',
        email: 'yohannes.t@addiscare.com',
        password: hashedPassword,
        phone: '+251911223350',
        address: 'Saris, Addis Ababa',
        role: 'reporter',
        status: 'active',
        createdAt: now,
        updatedAt: now
      }
    ]);

    const allUsers = [admin, ...govtOfficials, ...reporters];
    console.log(`Created ${allUsers.length} users`);

    // Create sample reports
    const reports = [];
    const reportTitles = [
      // Road-related
      'Pothole on Main Road',
      'Cracked Pavement',
      'Damaged Road Sign',
      'Flooded Street',
      'Icy Road Conditions',
      
      // Building-related
      'Cracked Building Wall',
      'Unsafe Construction Site',
      'Damaged Sidewalk',
      'Broken Staircase',
      'Dangerous Balcony',
      
      // Environment-related
      'Illegal Dumping',
      'Air Pollution from Factory',
      'Excessive Noise',
      'Contaminated Water',
      'Burning of Waste',
      
      // Public Service-related
      'Street Light Not Working',
      'Broken Water Fountain',
      'Damaged Public Bench',
      'Playground Equipment Broken',
      'Public Toilets Unhygienic',
      
      // Other
      'General Safety Concern',
      'Unidentified Hazard',
      'Community Concern',
      'Other Public Safety Issue'
    ];

    const reportDescriptions = [
      'This issue has been causing problems for several days now.',
      'The situation is getting worse and needs immediate attention.',
      'This is a recurring problem in this area.',
      'Children and elderly are particularly affected by this issue.',
      'This poses a safety hazard to pedestrians and drivers alike.'
    ];

    // Create 20 sample reports
    for (let i = 0; i < 20; i++) {
      const location = getRandomElement(LOCATIONS);
      const reporter = getRandomElement(reporters);
      const status = getRandomElement(STATUSES);
      const assignedTo = status !== 'pending' ? getRandomElement(govtOfficials)._id : undefined;
      
      const report = await Report.create({
        title: getRandomElement(reportTitles),
        description: getRandomElement(reportDescriptions),
        location: location.name,
        coordinates: location.coordinates,
        category: getRandomElement(CATEGORIES),
        reporter: reporter._id,
        status: status,
        assignedTo: assignedTo,
        urgency: getRandomInt(1, 5),
        images: [],
        votes: getRandomInt(0, 50),
        comments: [],
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Random date in last 30 days
        updatedAt: new Date()
      });

      // Add some comments to some reports
      if (Math.random() > 0.5) {
        const commentCount = getRandomInt(1, 5);
        for (let j = 0; j < commentCount; j++) {
          const commenter = getRandomElement(allUsers);
          report.comments.push({
            user: commenter._id,
            text: `Comment ${j + 1} by ${commenter.name}: This is a sample comment.`,
            createdAt: new Date()
          });
        }
        await report.save();
      }

      // Update the report status if not pending
      if (status !== 'pending') {
        report.status = status;
        report.assignedTo = assignedTo || admin._id;
        await report.save();
      }

      reports.push(report);
    }

    console.log(`Created ${reports.length} reports`);
    console.log('Database seeded successfully!');
    
    // Close the connection after seeding
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://yabets:yabets123@addiscare.cihweqx.mongodb.net/addiscare?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    return seedData();
  })
  .catch(error => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });
