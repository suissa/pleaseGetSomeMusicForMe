'use strict'

const rp = require(`request-promise`)
const crawler = require('youtube-crawler')
const cheerio = require('cheerio')
const fs = require('fs')

const BASE = `http://www.youtubeinmp3.com`

const getLinks = {
  uri: '',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
  }
}

function YoutubeInMp3 () {

  this.url = `${BASE}/widget/button/?video=`

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

    return songs 
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
  }).catch(err => Promise.reject("não foi encontrado resultados em Youtube"))
}

YoutubeInMp3.prototype.prepareForDownload = function (title, uri, path) {

  let self = this
  getLinks.uri = uri

  return Promise.resolve(
    rp.get(getLinks)
      .then(body => {
        let $ = cheerio.load(body)
        let url = BASE + $('#downloadButton').prop('href')

        rp(url).on('response', res => {
          console.time(`tempo para baixar ${title}.mp3 de YoutubeInMp3`)
          console.log(`\n\t\t baixando ${title} ... `)
        })
        .pipe(fs.createWriteStream(path))
        .on(`error`, (err) =>
          console.log(`MERDA AO BAIXAR DE: ${url} \n`, title))
        //.pipe(fs.createWriteStream(
        .on( `finish`, () => {
            console.log(`\t\t\t Baixada: ${title}.mp3`)
            console.timeEnd(`tempo para baixar ${title}.mp3 de YoutubeInMp3`)
        })
      })
    )
}


module.exports = new YoutubeInMp3()