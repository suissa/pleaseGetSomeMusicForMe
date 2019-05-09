'use strict'

const rp = require(`request-promise`)
const ProgressBar = require(`progress`)
const crawler = require('youtube-crawler')
const cheerio = require('cheerio')
const fs = require('fs')

const BASE = `https://www.convertmp3.io`

const getLinks = {
  uri: '',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
  }
}

function YoutubeInMp3 () {

  this.url = `${BASE}/download/?video=`

  this.buildSongs = (response) => {

    var self = this

    let list = response

    console.log(`\n\t\t Recebi a lista de ${list.length} mp3s ... `)
    console.log(`\n\t\t MAS BAIXAREI APENAS AS QUE VC ESCOLHER! `)

    let songs = list.map(song => {

      song.artist = self.guessArtistNameByTitle(song.title)

      song.tit_art = song.title
      song.url = this.url + song.link
      return song
    })

    return Promise.resolve(songs)
  },

  this.guessArtistNameByTitle = (title) => {
    //improve this
    let byHiphen = title.split('-')[0];
    let byColon = title.split(':')[0];

    return (byHiphen.length < title.length) ? byHiphen.trim() : byColon.trim()
  }

}

YoutubeInMp3.prototype.search = function (query) {

  let self = this

  return Promise.resolve({
    then: (resolve, reject) => {
      crawler(query.replace("+", ""), (err, results) => {
        return resolve({
          songs: self.buildSongs(results),
          download: self.prepareForDownload
        })
      })
    }
}).catch(err => Promise.reject(err))
}

YoutubeInMp3.prototype.prepareForDownload = function (title, uri, path) {

  let self = this
  getLinks.uri = uri

  return Promise.resolve(
    rp.get(getLinks)
      .then(body => {
        let $ = cheerio.load(body)
        let url = BASE + $('#download').prop('href')

        rp(url).on('response', res => {
          console.log(`\n\t\t baixando ${title} ... `)
          var len = parseInt(res.headers['content-length'], 10);

          console.log();
          var bar = new ProgressBar('  baixando [:bar] :rate/bps :percent :etas', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: len
          });

          res.on('data', function (chunk) {
            bar.tick(chunk.length);
          });

          res.on('end', function () {
            console.log('\n');
          });
        })
        .on(`error`, (err) =>
          console.log(`MERDA AO BAIXAR DE: ${url} \n`, title))
      //.pipe(fs.createWriteStream())
      .pipe(fs.createWriteStream(path))
      .on( `finish`, () => {
          console.log(`\t\t\t Baixada: ${title}.mp3`)
      })
    })
  )
}


module.exports = new YoutubeInMp3()
