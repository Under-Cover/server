const express = require("express");
const { createServer } = require("node:http");
// integrate socket.io
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3000
const app = express();

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// segala bentuk http request
app.get("/", (req, res) => {
  res.json({ message: "Hello world" });
});

let messages = [];
let players = [];
let undercover = "";
let vote = {};
let totalVoters = 0;
let kartuindex
let temaList = [
  ["nasi goreng", "nasi uduk"],
  ["paris", "london"],
  ["ayam goreng", "ayam bakar"],
  ["Basket", "Voli"],
  ["Kopi", "Teh"],
  ["Pensil", "Pulpen"],
  ["Laptop", "Komputer"]
];
let cardStates 
let listCard = [false, false, false, false]


let tema = temaList[Math.floor(Math.random() * temaList.length)];
let temaUndercover = tema[Math.floor(Math.random() * tema.length)];
let temaNonUndercover = tema.filter((tema) => {
  return tema !== temaUndercover;
});
// realtime pake yang dibawah ini
// io.emit("terserah:broadcast", cardStates)
io.on("connection", (socket) => {
  // update table user add socketId
  console.log("a user connected", socket.id);
  console.log(cardStates, "maunua si dapettt");
  io.emit("awikwokwok", kartuindex);
  socket.on("new-player", ({ sender }) => {
    console.log(players,sender, "<<<<<<<<<");
    if (!players.includes(sender)) {
      console.log(players.length, "masuk ga?");
      players.push(sender);
      if (players.length > 4){
        console.log("KELEBIHAN BOSSSSSSS");

        io.emit("kelebihan", {messages: "WADUH udah penuh nih! tunggu ya!", sender})
        players.pop()
      }
      if (players.length === 4) {
        undercover = players[Math.floor(Math.random() * players.length)];
        console.log(temaNonUndercover, "non under");
        console.log(temaUndercover, "under");

        io.emit("choosedPlayer", undercover, temaUndercover, temaNonUndercover);
      }
    }
    io.emit("player:broadcast", players);
    // console.log(players);
    // console.log(undercover);
  });

  socket.on('setawik', ({i}) => {
    kartuindex = i
    io.emit("awikwok", kartuindex);
    console.log(kartuindex);
    
  })

socket.on("terserah", ({i}) => {
  console.log(players);
  console.log(i);
  cardStates = i
  listCard[i] = true
  io.emit("terserah:broadcast", cardStates)
  console.log(listCard, "<<<<<<<<<<");

})



  if (players.length === 4) {
    io.emit("choosedPlayer", undercover, temaUndercover, temaNonUndercover);
  }
  // kita akan bikin lister/events
  socket.on("/messages/create", ({ text, sender }) => {
    console.log("message from client", { sender, text });

    // kita simpan ke db
    messages.push({ text, sender, createdAt: new Date() });

    // kirim message ke semua user yang konek
    io.emit("messages:broadcast", messages);
  });

  socket.on('/messages/get', () => {
    io.emit("messages:broadcast", messages);
  })

  // kita akan bikin lister/events
  // socket.on("/player/create", ({ playerName }) => {

  //   // kita simpan ke db
  //   player.push({ playerName });
  //   console.log(player,'playerrrrrr');

  //   // kirim message ke semua user yang konek
  //   io.emit("player:broadcast", player);
  // });
  socket.on("vote-count", ({ votePlayer }) => {
    console.log(votePlayer, "votevote");
    if (vote[votePlayer] === undefined) {
      vote[votePlayer] = 0;
    }
    vote[votePlayer]++;
    console.log(vote);
    totalVoters = 0;
    for (const key in vote) {
      totalVoters += vote[key];
    }
    if (totalVoters === players.length) {
      let mostVoted = null;
      let max = -Infinity;
      for (const key in vote) {
        if (vote[key] > max) {
          max = vote[key];
          mostVoted = key;
        } else if (vote[key] === max) {
          mostVoted = null;
        }
      }

      if (mostVoted === undercover) {
        io.emit("endGame", { result: "win", undercover });
      } else {
        io.emit("endGame", { result: "lose", undercover });
      }
    }
  });

  socket.on("ended", ({ ended }) => {
    kartuindex = null
    messages = [];
    players = [];
    undercover = "";
    vote = {};
    totalVoters = 0;
    tema = temaList[Math.floor(Math.random() * temaList.length)];
    temaUndercover = tema[Math.floor(Math.random() * tema.length)];
    temaNonUndercover = tema.filter((tema) => {
      return tema !== temaUndercover;
    });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    // remove socketId dari table user
    players = players.filter((player) => player !== socket.id);
    io.emit("new-player", players);
  });
});

server.listen(PORT, () => {
  console.log("server running at http://localhost:3000");
});