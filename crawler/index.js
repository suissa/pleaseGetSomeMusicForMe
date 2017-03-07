#!/usr/bin/env node
const os = require(`os`)
const fs = require(`fs`)
const rp = require(`request-promise`)
// const PATH = os.homedir()+'/Music/download/'
const PATH = './musics/'
const find = process.argv.filter(el => 
  !el.includes('/') && !el.includes('\\') ).join('+')
const page = `&page=0`
const BASE = `http://slider.kz`
const uri = `${BASE}/new/include/vk_auth.php?act=source1&q=${find}`
const inquirer = require('inquirer')

const events = require('events')
const eventEmitter = new events.EventEmitter()

const findBestArtistMatch = (str, anotherString) => {
    //TODO: improve validation
    if (str.length < anotherString.length) {
        let match = new RegExp(str, 'i').test(find.replace('+', ' '))

        if (!match) {
            return anotherString
        }
    }

    return str
}

console.log('PATH', PATH)
function decodeHTMLEntities (str) {
  if(str && typeof str === 'string') {
    str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '')
    str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '')
    str = str.replace(/&#x[A-Z][0-9]/gmi, '')
  }
  return str
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

const removeDupes = (song, i, self) => self.findIndex(s => s.tit_art == song.tit_art) === i

const choose = (songs, cb) => {

  const artists = []

  const question1 = {
    type: 'checkbox',
    message: 'Selecione as canções',
    name: 'songs',
    choices: [
      new inquirer.Separator(' = As sonzeiras = ')
    ],
    validate: (answer) => !! answer.length
  }

  songs.map((song, key) => {
      question1.choices.push({ name: song.tit_art })
      if (!artists.includes(song.artist)) artists.push(song.artist)
  })

  const artist = artists.reduce(findBestArtistMatch);

  inquirer.prompt([
    question1
  ]).then((answers) => {
      return cb(null, {
          artist: artist,
          songs: songs
          .filter((song) => answers.songs.includes(song.tit_art))
          .filter(removeDupes)
        }
      )
  });

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

    console.log(`\n\t\t Recebi a lista de ${list.feed.length} mp3s ... `)
    console.log(`\n\t\t MAS BAIXAREI APENAS AS QUE VC ESCOLHER! `)

    const listToSave = list.feed.map( el => el.entry )
    const totalMp3 = list.feed.length
    const total = 1

    mp3Down = function(total,listToSave){
      const musics = listToSave.splice(0,total).map( el => {
        // const PATH = os.homedir()+'/Music/download/'+el.artist.replace('/', '_')
        const path = PATH + el.artist.replace(/\//g, '_')
        const cb = (err) =>
          err
            ? console.log('\n\t\tERRO AO CRIAR A PASTA', err)
            : rp.get(`${BASE}${el.url}`)
                .on(`response`,res => {
                  console.time(`\n\t\ttempo para baixar ${el.tit_art}.mp3`)
                  console.log(`\n\t\t baixando ${el.tit_art} ... `)
                })
                .on(`error`, (err) =>
                  console.log(`\n\t\tERRO AO BAIXAR DE: ${BASE}${el.url} \n`, el.tit_art))
                .pipe(fs.createWriteStream(path+'/'+decodeHTMLEntities(el.tit_art+'.mp3')))
                .on( `finish`, () => {
                  console.log(`\n\t\t Baixada: ${el.tit_art}.mp3`)
                  console.timeEnd(`\n\t\ttempo para baixar ${el.tit_art}.mp3`)
                  total++
                  mp3Down(total,listToSave)
                })
        ensureExists( path, 0744, cb)
      })
    }

    choose(listToSave, (err, response) => {

      ( ! response.songs )
        ? console.log("não foi escolhido/encontrado nenhuma música")
        : response.songs.map( el => {
            const PATH = PATH + response.artist.replace('/', '_')
            const cb = (err) =>
            err 
                ? console.log('Nao rolou criar as pastas aqui', err)
                : rp.get(`${BASE}${el.url}`)
                    .on(`response`, res => {
                        console.time(`tempo para baixar ${el.tit_art}.mp3`)
                        console.log(`\n\t\t baixando ${el.tit_art} ... `)
                    })
                    .on(`error`, (err) =>
                        console.log(`MERDA AO BAIXAR DE: ${BASE}${el.url} \n`, el.tit_art))
                    .pipe(fs.createWriteStream(ARTISTPATH+'/'+decodeHTMLEntities(el.tit_art+'.mp3')))
                    .on( `finish`, () => {
                        console.log(`\t\t\t Baixada: ${el.tit_art}.mp3`)
                        console.timeEnd(`tempo para baixar ${el.tit_art}.mp3`)
                        // process.exit(1) 
                    })

            // console.log('PATH', PATH)
            Promise.
              all([{
                //main folder
                then: (resolve, reject) => ensureExists(PATH, 0744, (err) => resolve(err))
              }, {
                //artist folder
                then: (resolve, reject) => ensureExists(ARTISTPATH, 0744, (err) => resolve(err))
              }])
              .then(err => (err.reduce((f, s) => f || s)) ? Promise.reject(err) : cb(null))
              .catch(err => cb(err))
            
          })
        
        return response.songs
    })

    return false

  })
  // .then( body => {

  // })
  .catch( err => {
      console.log(`err`, err)
  })
