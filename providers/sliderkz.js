'use strict'

const rp = require(`request-promise`)
const fs = require('fs')

const BASE = `https://slider.kz`

const getLinks = {
  uri: '',
  headers: {
      'Content-Type': `application/json`,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
      'Referer': 'https://slider.kz/'
  },
  json: true
}

function SliderKZ () {

  this.url = `${BASE}/vk_auth.php?&q=`
  this.page = `&page=0`

  this.buildSongs = (response) => {

    if ( ! response.audios ) return console.log('Não achou essa busca!')

    let pageCount = Object.keys(response.audios)[0]
    const list = response.audios[Object.keys(response.audios)[0]]

    var p = new Promise((resolve, reject) => {

        let newList = list.map(s => {
            s.url = `${BASE}/download/${s.id}/${s.duration}/${s.url}/${s.tit_art}.mp3?extra=${s.extra}`
            return s
        })
        resolve(newList)
    })

    return p.then((resp) => resp)
  }
}

SliderKZ.prototype.search = function (query) {

  getLinks.uri = [this.url, query].join('');

  let self = this

  return Promise.resolve(rp(getLinks)
    .then(body => {
      return {
        songs: self.buildSongs(body),
        download: self.prepareForDownload
      }
    })
    .catch(err => Promise.reject(err)))
}

SliderKZ.prototype.prepareForDownload = function (title, uri, path) {

  let self = this
  getLinks.uri = uri

  return Promise.resolve(
    rp.get(getLinks)
    .on('response', res => {
          var len = parseInt(res.headers['content-length'], 10);

          let s = title + ': \n'
          multi.write(s);
          var bar = multi(40, 3 + index, {
              width : 20,
              solid : {
                  text : ' ',
                  foreground : 'white',
                  background : 'blue'
              },
              empty : { text : ' ' },
          });

          var total = 0
          res.on('data', function (chunk) {
              total += (chunk.byteLength * 100)  / len;
              bar.percent(parseInt(Math.round(total)));
          });

          res.on('end', function () {
          });
        })
        .on(`error`, (err) =>
          console.log(`MERDA AO BAIXAR DE: ${songUrl} \n`, title))
      //.pipe(fs.createWriteStream())
      .pipe(fs.createWriteStream(path))
      .on( `finish`, () => {
          console.log(`\t\t\t Baixada: ${title}.mp3`)
      })
  )


}

module.exports = new SliderKZ()
