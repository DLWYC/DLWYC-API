// Define the youth data with their ages
const youth = [
    { name: 'John', age: 18 },
    { name: 'Jane', age: 29 },
    { name: 'Bob', age: 29 },
    { name: 'Alice', age: 21 },
//     { name: 'Mike', age: 18 },
//     { name: 'Emma', age: 23 },
//     { name: 'Tom', age: 20 },
//     { name: 'Sophia', age: 19 },
    // Add more youth data here...
  ];
  
  // Define the age groups
  const ageGroups = [
    { min: 18, max: 30 },
    // Add more age groups here...
  ];
  
  // Define the room capacity
  const roomCapacity = 4;
  
  // Function to allocate rooms
  function allocateRooms(youth) {
    // Sort the youth by age in descending order
    youth.sort((a, b) => b.age - a.age);
  
    // Initialize the rooms array
    const rooms = [
        { name: 'John', age: 18 },
    { name: 'Jane', age: 29 },
    { name: 'Bob', age: 29 },
    { name: 'Alice', age: 21 },
    ];
  
    // Loop through the age groups
    for (const ageGroup of ageGroups) {
      // Filter the youth by age group
      const ageGroupYouth = youth.filter((y) => y.age >= ageGroup.min && y.age <= ageGroup.max);
  
      // Loop through the filtered youth
      for (let i = 0; i < ageGroupYouth.length; i += roomCapacity) {
        // Create a new room
        const room = ageGroupYouth.slice(i, i + roomCapacity);
  
        // Select the eldest as the room head
        room.head = room[0];
  
        // Add the room to the rooms array
        rooms.push(room);
      }
    }
//     console.log(`ROMMMMFDMJDNF: ${rooms}`)
    return rooms;
  }
  
  // Call the function and log the result
  const allocatedRooms = allocateRooms(youth);
  console.log(allocatedRooms);