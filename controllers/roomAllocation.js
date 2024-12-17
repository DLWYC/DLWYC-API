const hostelRooms = {
  male: [
    { room: "HABOR", capacity: 16, allocated: 0 },
    { room: "DEUEL", capacity: 34, allocated: 0 },
    { room: "EBENEZER", capacity: 44, allocated: 0 },
    { room: "NATHAN", capacity: 34, allocated: 0 },
    { room: "HOSANNA", capacity: 4, allocated: 0 },
    { room: "PHANUEL", capacity: 4, allocated: 0 },
    { room: "PORATHA", capacity: 4, allocated: 0 },
    { room: "HANIEL", capacity: 4, allocated: 0 },
    { room: "RABBI", capacity: 4, allocated: 0 },
    { room: "MIBHAR", capacity: 4, allocated: 0 },
    { room: "IMMANUEAL", capacity: 4, allocated: 0 },
    { room: "MELCHI", capacity: 4, allocated: 0 },
    { room: "DANIEL", capacity: 2, allocated: 0 },
    { room: "HENOCH", capacity: 4, allocated: 0 },
    { room: "JAASIEL", capacity: 4, allocated: 0 },
    { room: "JUDAH", capacity: 4, allocated: 0 },
    { room: "PETHUEL", capacity: 4, allocated: 0 },
    { room: "HANANEEL", capacity: 4, allocated: 0 },
    { room: "HENOCH", capacity: 4, allocated: 0 },
    { room: "PENIEL", capacity: 4, allocated: 0 },
    { room: "BETH-MEON", capacity: 4, allocated: 0 },
    { room: "ISAAC", capacity: 4, allocated: 0 },
    { room: "ISAIAH", capacity: 4, allocated: 0 },
    { room: "ISRAEL", capacity: 4, allocated: 0 },
    { room: "JAAZIAH", capacity: 4, allocated: 0 },
    { room: "CHILIAB", capacity: 4, allocated: 0 },
    { room: "JABNEEL", capacity: 4, allocated: 0 },
    { room: "PENINNAH", capacity: 4, allocated: 0 },
    { room: "DARDA", capacity: 4, allocated: 0 },
    { room: "GABRIEL", capacity: 4, allocated: 0 },
    { room: "JAHAZIAH", capacity: 4, allocated: 0 },
    { room: "CONIAH", capacity: 4, allocated: 0 },
    { room: "RABBAH", capacity: 4, allocated: 0 },
    { room: "JAAZAH", capacity: 4, allocated: 0 },
    { room: "RAGUEL", capacity: 4, allocated: 0 },
    { room: "PELATIAH", capacity: 4, allocated: 0 },
    { room: "ABRAHAM", capacity: 8, allocated: 0 },
    { room: "GOMER", capacity: 8, allocated: 0 },
    { room: "ABIMAEL", capacity: 4, allocated: 0 },
    { room: "KOLARIAH", capacity: 4, allocated: 0 },
    { room: "KEMUEL", capacity: 4, allocated: 0 },
    { room: "REHOBOTH", capacity: 4, allocated: 0 },
    { room: "ISHMAIAH", capacity: 4, allocated: 0 },
    { room: "MELECH", capacity: 4, allocated: 0 },
    { room: "NABOTH", capacity: 4, allocated: 0 },
    { room: "OBADIAH", capacity: 4, allocated: 0 },
    { room: "ISHMAEL", capacity: 4, allocated: 0 },
    { room: "ELADAH", capacity: 4, allocated: 0 },
    { room: "DARAH", capacity: 4, allocated: 0 },
    { room: "MALCHUS", capacity: 4, allocated: 0 },
    { room: "HAGGITH", capacity: 4, allocated: 0 },
    { room: "HANAN", capacity: 4, allocated: 0 },
    { room: "KABZEEL", capacity: 4, allocated: 0 },
  ],
  female: [
    { room: "SALEM", capacity: 36, allocated: 0 },
    { room: "SALMA", capacity: 44, allocated: 0 },
    { room: "SHILOH", capacity: 40, allocated: 0 },
    { room: "SABAOTH", capacity: 72, allocated: 0 },
    { room: "TABEAL", capacity: 72, allocated: 0 },
    { room: "ROME", capacity: 40, allocated: 0 },
    { room: "PENINNAH", capacity: 40, allocated: 0 },
  ],
};

function allocateHostels(name, age, gender){

  // Checking the Avilable rooms per hostels
  const availableRooms = hostelRooms[gender.toLowerCase()].filter(
    (room) => room.allocated < room.capacity
  );

  // So this function gets all the rooms that still have space for allcation i.e where the number of peple there currently are less that the total number of people that is to be in that room, then i randomizes them e.g avalableRooms = [room a, room b, room c]
  // and then the randomlySelectedRoom deals with the indexs of the values in teh array of available rooms then picks one and increase the value of allocated room by 1
  if (availableRooms.length > 0) {
    const randomlySelectRoom =
      availableRooms[Math.floor(Math.random() * availableRooms.length)];
    randomlySelectRoom.allocated += 1;

    console.log('The Total Room', hostelRooms)
    console.log('The Allocated Room', randomlySelectRoom)
    console.log('The Available Room', availableRooms)

    return {
      message: `Successfully Allocated ${name} to ${randomlySelectRoom.room}`,
      data: randomlySelectRoom,
    };
  } else {
    return { message: `No Available Room For ${name}` };
  }
};


module.exports = {allocateHostels}