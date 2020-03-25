const express = require('express');
const app = express();
const http = require('http').createServer(app);
const path = require('path');
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');
//const socketio = require('socket.io');

//const server = http.createServer(app);
const io = require('socket.io')(http);

//set static folder
app.use(express.static(path.join(__dirname, 'public')));

const adminName = 'ChatAdmin';

//Run when client connects
io.on('connection', socket => {
  //CATCH joinChat room from client side
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    //Welcome current user (emits only to the user who connects)
    socket.emit('message', formatMessage(adminName, 'Welcome to Chat App!'));

    //Broadcast when user connects(broadcast emits to everybody besides the user who connects)
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(adminName, `${user.username} has joined the chat`)
      );
    //send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  //CATCH chatMessage from client
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);
    //emit back to the client side(to every user)
    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  //Runs when client disconnects, io.emit (emits message to everybody)
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(adminName, `${user.username} has left the chat`)
      );

      //send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

const PORT = 3000 || process.env.PORT;

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
