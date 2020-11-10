import path from 'path';

import express from 'express';
import http from 'http';
const app = express();
const server = http.createServer(app);
const port = 3000;

import geckos from '@geckos.io/server';
const io = geckos();

import PSON from 'pson';
const pson = new PSON.StaticPair(["hej"]);

io.addServer(server);

app.use("/", express.static(path.join(__dirname, "../../public")));
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
    console.log(`spela spel gratis på http://localhost:${port}`)
});
