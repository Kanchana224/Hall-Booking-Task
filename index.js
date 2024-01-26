const express = require("express");
const app = express();
const PORT = 8000;

let rooms = [];
let bookings = [];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function isRoomAvailable(roomId, date, startTime, endTime) {
    const conflictBooking = bookings.find((booking) => {
        return (
            booking.roomId === roomId &&
            booking.date === date &&
            ((startTime >= booking.startTime && startTime < booking.endTime) ||
                (endTime > booking.startTime && endTime <= booking.endTime) ||
                (startTime <= booking.startTime && endTime >= booking.endTime))
        );
    });
    return !conflictBooking;
}

app.post("/bookRoom", (req, res) => {
    const { customerName, date, startTime, endTime, roomId } = req.body;
    if (!isRoomAvailable(roomId, date, startTime, endTime)) {
        return res.status(400).json({ error: 'Room is already booked at the specified date and time.' });
    }
    const newBooking = {
        customerName,
        date,
        startTime,
        endTime,
        roomId,
        bookingId: bookings.length + 1,
        bookingDate: new Date().toDateString(),
        bookingStatus: "Confirmed",
    };
    bookings.push(newBooking);
    
    // Check if the room already exists
    const existingRoom = rooms.find((room) => room.roomNumber === roomId);
    if (!existingRoom) {
        // If the room doesn't exist, create a new room
        const newRoom = {
            roomNumber: roomId,
            seats: null,  // You may need to set these values based on your requirements
            amenities: null,
            pricePerHour: null,
        };
        rooms.push(newRoom);
    }
    
    res.status(201).json(newBooking);
});

app.post("/createRoom", (req, res) => {
    const { roomNumber, seats, amenities, pricePerHour } = req.body;
    const newRoom = { roomNumber, seats, amenities, pricePerHour };
    rooms.push(newRoom);
    res.status(201).json(newRoom);
});

app.get("/listAllRooms", (req, res) => {
    const roomList = rooms.map((room) => {
        const bookedData = bookings.filter((booking) => booking.roomId === room.roomNumber);
        return {
            roomName: room.roomNumber,
            bookedStatus: bookedData.length > 0 ? 'Booked' : 'Available',
            bookings: bookedData.map((booking) => ({
                customerName: booking.customerName,
                date: booking.date,
                startTime: booking.startTime,
                endTime: booking.endTime,
            })),
        };
    });
    res.json(roomList);
});

app.get("/listAllCustomers", (req, res) => {
    const customerList = bookings.map((booking) => {
        const room = rooms.find((room) => room.roomNumber === booking.roomId);
        return {
            customerName: booking.customerName,
            roomName: room ? room.roomNumber : "Undefined Room",
            date: booking.date,
            startTime: booking.startTime,
            endTime: booking.endTime,
        };
    });
    res.json(customerList);
});

app.get("/customerBookingHistory/:customerName", (req, res) => {
    const { customerName } = req.params;
    const customerBookings = bookings.filter((booking) => booking.customerName === customerName);
    res.json(customerBookings);
});

app.listen(PORT, () => {
    console.log(`Server is running on localhost:${PORT}`);
});
