const express = require("express");
const { createServer } = require("node:http");
// integrate socket.io
const { Server } = require("socket.io");

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
let temaList = [
  ["nasi goreng", "nasi uduk"],
  ["paris", "london"],
  ["ayam goreng", "ayam bakar"],
  ["Basket", "Voli"],
  ["Kopi", "Teh"],
  ["Pensil", "Pulpen"],
  ["Laptop", "Komputer"]
];

let tema = temaList[Math.floor(Math.random() * temaList.length)];
let temaUndercover = tema[Math.floor(Math.random() * tema.length)];
let temaNonUndercover = tema.filter((tema) => {
  return tema !== temaUndercover;
});
// realtime pake yang dibawah ini
io.on("connection", (socket) => {
  // update table user add socketId
  console.log("a user connected", socket.id);

  socket.on("new-player", ({ sender }) => {
    if (!players.includes(sender)) {
      players.push(sender);
      if (players.length === 4) {
        undercover = players[Math.floor(Math.random() * players.length)];
        console.log(temaNonUndercover);
        console.log(temaUndercover);

        io.emit("choosedPlayer", undercover, temaUndercover, temaNonUndercover);
      }
    }
    io.emit("player:broadcast", players);
    console.log(players);
    console.log(undercover);
  });

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

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
