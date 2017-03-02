#!/usr/bin/env node
const fs = require(`fs`)
const rp = require(`request-promise`)
const PATH = '/Users/caionorder/Music/download/'
const find = process.argv.filter(el => !el.includes('/')).join('+')
const page = `&page=0`
const BASE = `http://slider.kz`
const uri = `${BASE}/new/include/vk_auth.php?act=source1&q=${find}`

const events = require('events')
const eventEmitter = new events.EventEmitter()

function decodeHTMLEntities (str) {
  if(str && typeof str === 'string') {
    str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
    str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
    str = str.replace(/&#x[A-Z][0-9];/gmi, '');
  }
  return str;
}

const ensureExists = (path, mask, cb) => {
    if (typeof mask == 'function') {
        cb = mask
        mask = 0777
    }
    fs.mkdir(path, mask, (err) =>
        ( err ) 
            ? (err.code == 'EEXIST') ? cb(null) : cb(err)
            : cb(null))
}

var getLinks = {
    uri,
    headers: {
        'Content-Type': `application/json`
    },
    json: true
}

console.time('tempo para receber a resposta')
console.log(`\n\n\n\t\t INICIANDO A BUSCA PARA: ${find} `)

rp(getLinks)
    .then(function(response) {
        console.timeEnd('tempo para receber a resposta')
        if ( ! response.trim().length ) return console.log('Não achou essa busca!')

        const list = JSON.parse(response.trim())

        console.log(`\n\t\t recebi a lista de ${list.feed.length} mp3s ... `)

        const listToSave = list.feed.map( el => el.entry )
        const totalMp3 = list.feed.length
        const total = 1

        mp3Down = function(total,listToSave){
            const musics = listToSave.splice(0,total).map( el => {
                const PATH = '/Users/caionorder/Music/download/'+el.artist.replace('/', '_');
                const cb = (err) =>
                    err
                        ? console.log('ERRO AO CRIAR A PASTA', err)
                        : rp.get(`${BASE}${el.url}`)
                            .on(`response`,res => {
                                console.time(`tempo para baixar ${el.tit_art}.mp3`)
                                console.log(`\n\t\t baixando ${el.tit_art} ... `)
                            })
                            .on(`error`, (err) =>
                                console.log(`ERRO AO BAIXAR DE: ${BASE}${el.url} \n`, el.tit_art))
                            .pipe(fs.createWriteStream(PATH+'/'+decodeHTMLEntities(el.tit_art+'.mp3')))
                            .on( `finish`, () => {
                                console.log(`\t\t\t Baixada: ${el.tit_art}.mp3`)
                                console.timeEnd(`tempo para baixar ${el.tit_art}.mp3`)
                                total++
                                mp3Down(total,listToSave)
                            })
                ensureExists( PATH, 0744, cb)
            })

        }

        mp3Down(total,listToSave)

        return listToSave
    })
    .then( body => {

    })
    .catch( err => {
        console.log(`err`, err)
    })