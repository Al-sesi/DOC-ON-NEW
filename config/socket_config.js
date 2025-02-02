const { Server } = require("socket.io");

let io; // Define the Socket.IO instance globally in this module

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Update this to restrict access in production
        },
    });

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        // Join a specific thread
        socket.on("join-thread", (threadId) => {
            socket.join(threadId);
            console.log(`Client joined thread: ${threadId}`);
        });

        // Send a message to a thread
        socket.on("send-message", (data) => {
            const { threadId, message } = data;
            console.log(`Message sent to thread ${threadId}:`, message);
            io.to(threadId).emit("new-message", message);
        });

        // Handle disconnection
        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });
};

const getIOInstance = () => {
    if (!io) {
        throw new Error("Socket.IO is not initialized. Call initializeSocket first.");
    }
    return io;
};

module.exports = { initializeSocket, getIOInstance };
