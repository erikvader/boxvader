const path = require("path");
const express = require("express");
const geckos = require("@geckos.io/server").default;
const http = require("http");
const PSON = require("pson");
const app = express();
const server = http.createServer(app);
const io = geckos();
const port = 3000;

const pson = new PSON.StaticPair(["hej"]);

io.addServer(server);

app.use("/", express.static(path.join(__dirname, "../../dist")));

io.onConnection(channel => {
    console.log(`${channel.id} connected`);
    channel.onDisconnect(() => {
        console.log(`${channel.id} disconnected`);
    })

    channel.onRaw(data => {
        console.log(`got ${data}`);
        console.log(pson.decode(data));
        channel.raw.emit(data);
    });
});

server.listen(port, () => {
    console.log(`spela spel gratis på http://lokalhost:${port}`)
});
