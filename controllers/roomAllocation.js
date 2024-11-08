// // Define the youth data with their ages
// const youth = [
//     { name: 'John', age: 18 },
//     { name: 'Jane', age: 29 },
//     { name: 'Bob', age: 29 },
//     { name: 'Alice', age: 21 },
// //     { name: 'Mike', age: 18 },
// //     { name: 'Emma', age: 23 },
// //     { name: 'Tom', age: 20 },
// //     { name: 'Sophia', age: 19 },
//     // Add more youth data here...
//   ];
  
//   // Define the age groups
//   const ageGroups = [
//     { min: 18, max: 30 },
//     // Add more age groups here...
//   ];
  
//   // Define the room capacity
//   const roomCapacity = 4;
  
//   // Function to allocate rooms
//   function allocateRooms(youth) {
//     // Sort the youth by age in descending order
//     youth.sort((a, b) => b.age - a.age);
  
//     // Initialize the rooms array
//     const rooms = [
//         { name: 'John', age: 18 },
//     { name: 'Jane', age: 29 },
//     { name: 'Bob', age: 29 },
//     { name: 'Alice', age: 21 },
//     ];
  
//     // Loop through the age groups
//     for (const ageGroup of ageGroups) {
//       // Filter the youth by age group
//       const ageGroupYouth = youth.filter((y) => y.age >= ageGroup.min && y.age <= ageGroup.max);
  
//       // Loop through the filtered youth
//       for (let i = 0; i < ageGroupYouth.length; i += roomCapacity) {
//         // Create a new room
//         const room = ageGroupYouth.slice(i, i + roomCapacity);
  
//         // Select the eldest as the room head
//         room.head = room[0];
  
//         // Add the room to the rooms array
//         rooms.push(room);
//       }
//     }
// //     console.log(`ROMMMMFDMJDNF: ${rooms}`)
//     return rooms;
//   }
  
//   // Call the function and log the result
//   const allocatedRooms = allocateRooms(youth);
//   console.log(allocatedRooms);




// import React, { useState, useEffect } from 'react';

// // Sample Data
// const sampleYouths = [
//   { id: 1, name: 'John Doe', age: 20 },
//   { id: 2, name: 'Jane Smith', age: 22 },
//   { id: 3, name: 'Alice Brown', age: 18 },
//   { id: 4, name: 'Bob White', age: 25 },
//   { id: 5, name: 'Charlie Black', age: 23 },
//   { id: 6, name: 'David Green', age: 19 },
// ];

// const sampleRooms = [
//   { id: 'Room1', capacity: 2 },
//   { id: 'Room2', capacity: 2 },
//   { id: 'Room3', capacity: 2 },
// ];

// const HostelAllocation = () => {
//   const [youths, setYouths] = useState(sampleYouths);
//   const [rooms, setRooms] = useState(sampleRooms);
//   const [allocations, setAllocations] = useState([]);

//   // Function to allocate rooms based on available rooms, youth ages, and room capacity
//   const allocateRooms = () => {
//     // Shuffle the youths array to randomize allocation
//     const shuffledYouths = [...youths].sort(() => Math.random() - 0.5);
//     let allocatedRooms = [];

//     // Assign youths to rooms
//     rooms.forEach((room) => {
//       const roomCapacity = room.capacity;
//       const assignedYouths = shuffledYouths.splice(0, roomCapacity); // Assign based on room capacity

//       // Find the eldest in the room to make them room head
//       const eldestYouth = assignedYouths.reduce((eldest, youth) =>
//         youth.age > eldest.age ? youth : eldest
//       );

//       allocatedRooms.push({
//         roomId: room.id,
//         youths: assignedYouths,
//         roomHead: eldestYouth,
//       });
//     });

//     setAllocations(allocatedRooms);
//   };

//   return (
//     <div>
//       <h2>Hostel Allocation System</h2>
//       <button onClick={allocateRooms}>Allocate Rooms</button>
//       {allocations.length > 0 && (
//         <>
//           <h3>Allocations</h3>
//           <ul>
//             {allocations.map((allocation, index) => (
//               <li key={index}>
//                 <strong>Room ID:</strong> {allocation.roomId} <br />
//                 <strong>Youths:</strong>{' '}
//                 {allocation.youths.map((youth) => youth.name).join(', ')} <br />
//                 <strong>Room Head:</strong> {allocation.roomHead.name} ({allocation.roomHead.age} years old)
//               </li>
//             ))}
//           </ul>
//         </>
//       )}
//     </div>
//   );
// };

// export default HostelAllocation;









<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hostel Allocation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }
        button {
            background-color: #0073e6;
            color: white;
            padding: 10px 20px;
            border: none;
            cursor: pointer;
        }
        button:hover {
            background-color: #005bb5;
        }
    </style>
</head>
<body>

    <h2>Hostel Allocation System</h2>

    <button onclick="allocateRooms()">Allocate Rooms</button>

    <h3>Allocation Results</h3>
    <div id="result"></div>

    <script>
        // Example data for youths
        const youths = [
            { name: 'John', age: 22, gender: 'Male' },
            { name: 'Sara', age: 21, gender: 'Female' },
            { name: 'Michael', age: 20, gender: 'Male' },
            { name: 'Jessica', age: 23, gender: 'Female' },
            { name: 'David', age: 19, gender: 'Male' }
        ];

        // Example data for rooms
        const rooms = [
            { name: 'Male Room A', capacity: 2, allocated: 0, gender: 'Male' },
            { name: 'Male Room B', capacity: 3, allocated: 0, gender: 'Male' },
            { name: 'Female Room A', capacity: 2, allocated: 0, gender: 'Female' },
            { name: 'Female Room B', capacity: 1, allocated: 0, gender: 'Female' }
        ];

        function allocateRooms() {
            let resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '';  // Clear previous results

            youths.forEach(youth => {
                // Filter available rooms based on gender
                let availableRooms = rooms.filter(room => room.gender === youth.gender && room.allocated < room.capacity);

                if (availableRooms.length > 0) {
                    // Randomly assign a room
                    let randomRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)];
                    randomRoom.allocated += 1;

                    // Display the allocation
                    resultDiv.innerHTML += <p>${youth.name} (${youth.gender}, Age: ${youth.age}) is allocated to ${randomRoom.name}</p>;
                } else {
                    resultDiv.innerHTML += <p>No available rooms for ${youth.name} (${youth.gender}, Age: ${youth.age})</p>;
                }
            });
        }
    </script>

</body>
</html>