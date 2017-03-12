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

	let songs = rp(getLinks)
		.then(this.buildSongs)
		//.catch(err => Promise.reject(err))

	return songs
}

module.exports = new SliderKZ()
  