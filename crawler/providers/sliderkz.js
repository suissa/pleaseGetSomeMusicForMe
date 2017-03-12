'use strict'

const rp = require(`request-promise`)

const BASE = `http://slider.kz`

const getLinks = {
  uri: '',
  headers: {
      'Content-Type': `application/json`
  },
  json: true
}

function SliderKZ () {

  this.url = `${BASE}/new/include/vk_auth.php?act=source1&q=`
  this.page = `&page=0`

  this.buildSongs = (response) => {

    console.timeEnd('tempo para receber a resposta')
    if ( ! response.trim().length ) return console.log('Não achou essa busca!')

    const list = JSON.parse(response.trim())

    console.log(`\n\t\t Recebi a lista de ${list.feed.length} mp3s ... `)
    console.log(`\n\t\t MAS BAIXAREI APENAS AS QUE VC ESCOLHER! `)

    var p = new Promise()

    return p.resolve(list.feed.map( el => el.entry ))
  }
}

SliderKZ.prototype.search = function (query) {

  getLinks.uri = [this.url, query].join('');

  return Promise.resolve(rp(getLinks)
    .then(body => {
      return {
        songs: self.buildSongs(body),
        download: self.prepareForDownload
      }
    })
    .catch(err => Promise.reject("não foi encontrado resultados em Slider.KZ")))
}

SliderKZ.prototype.prepareForDownload = function (title, uri, path) {

  let self = this
  getLinks.uri = uri

  return Promise.resolve(
    rp.get(getLinks)
    .on('response', res => {
          console.time(`tempo para baixar ${title}.mp3 de SliderKZ`)
          console.log(`\n\t\t baixando ${title} ... `)
        })
        .on(`error`, (err) =>
          console.log(`MERDA AO BAIXAR DE: ${songUrl} \n`, title))
      //.pipe(fs.createWriteStream())
      .pipe(fs.createWriteStream(path))
      .on( `finish`, () => {
          console.log(`\t\t\t Baixada: ${title}.mp3`)
          console.timeEnd(`tempo para baixar ${title}.mp3 de SliderKZ`)
      })
  )
      

}

module.exports = new SliderKZ()
  