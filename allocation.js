const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Mock data for hostel rooms
let hostelRooms = {
  male: [
    { id: 'Male Room A', capacity: 2, allocated: 0 },
    { id: 'Male Room B', capacity: 3, allocated: 0 },
  ],
  female: [
    { id: 'Female Room A', capacity: 2, allocated: 0 },
    { id: 'Female Room B', capacity: 1, allocated: 0 },
  ],
};

// Array to hold registered campers
let campers = [];

// API to register a camper and allocate a room
app.post('/api/register', (req, res) => {
  const { name, age, gender } = req.body;

  // Create a new camper object
  const newCamper = { id: campers.length + 1, name, age, gender };
  campers.push(newCamper);

  console.log(campers)

  // Allocate room
  const availableRooms = hostelRooms[gender.toLowerCase()].filter(
    (room) => room.allocated < room.capacity
  );


  if (availableRooms.length > 0) {
    // Randomly assign a room
    const randomRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)];
    randomRoom.allocated += 1; // Increment the allocated count

    // Respond with the allocated room information
    res.json({
      message: `${newCamper.name} has been registered and allocated to ${randomRoom.id}.`,
      camper: newCamper,
      allocatedRoom: randomRoom,
    });
  } else {
    res.status(400).json({
      message: `No available rooms for ${newCamper.name}.`,
      camper: newCamper,
    });
  }
});

// API to fetch all registered campers
app.get('/api/campers', (req, res) => {
  res.json(campers);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});