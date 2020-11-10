import geckos from '@geckos.io/client';
import PSON from 'pson';
import app from './game';

const pson = new PSON.StaticPair(['hej']);

const channel = geckos({ port: 3000 });

channel.onConnect(error => {
  if (error) {
    console.error(error.message);
    return;
  }

  channel.onRaw(data => {
    let d = pson.decode(data);
    console.log(data);
    console.log('msg:', d);
  });

  let d = pson.encode({ hej: 1 }).toArrayBuffer();
  channel.raw.emit(d);
});

document.body.appendChild(app.view);
