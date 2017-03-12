'use strict'

const fs = require(`fs`)
const rp = require(`request-promise`)

const BASE = `http://databrainz.com`

const getLinks = {
	uri: '',
	headers: {
		'HOST': 'databrainz.com',
		'Referer': 'http://musicpleer.audio/',
		'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
	}
}

function MusicPleer () {

	this.urlSearch = `${BASE}/api/search_api.cgi?format=json&mh=50&where=mpl&r=&_=1489228409592&qry=`
	this.urlSong = `${BASE}/api/data_api_new.cgi?&r=mpl&format=json&_=1489228409608&id=`
	this.page = `&page=0`

	this.buildSongs = (response) => {

		var self = this

		let list = JSON.parse(response).results

		let songs = list.map(song => {
			let album = (song.album != '') ? ' - ' + song.album : ''

			song.tit_art = song.title + ' - ' + song.artist + album
			song.url = this.urlSong + song.url
			return song
		})

		return songs
			
	}

}

MusicPleer.prototype.search = function (query) {

	let self = this

	getLinks.uri = [this.urlSearch, query].join('');

	return Promise.resolve(rp(getLinks)
		.then(body => {
			return {
				songs: self.buildSongs(body),
				download: self.prepareForDownload
			}
		})
		.catch(err => err))

}

MusicPleer.prototype.prepareForDownload = function (title, uri, path) {

	let self = this
	getLinks.uri = uri

	return Promise.resolve(
		rp.get(getLinks)
	      .then(res => {
	      	rp(JSON.parse(res).song.url).on('response', res => {
	          console.time(`tempo para baixar ${title}.mp3`)
	          console.log(`\n\t\t baixando ${title} ... `)
	      	})
	      	.on(`error`, (err) =>
		        console.log(`MERDA AO BAIXAR DE: ${songUrl} \n`, title))
		    //.pipe(fs.createWriteStream())
		    .pipe(fs.createWriteStream(path))
		    .on( `finish`, () => {
		        console.log(`\t\t\t Baixada: ${title}.mp3`)
		        console.timeEnd(`tempo para baixar ${title}.mp3`)
		    })
	      })
	)
      

}


module.exports = new MusicPleer()
  