#!/usr/bin/env node
const os = require(`os`)
// const fs = require(`fs`)

const utils = require('./util')
const fs = require("fs-extra")
const inquirer = require('inquirer')
const Entities = require('html-entities').AllHtmlEntities
const entities = new Entities()
const PATH = '~/Desktop/'
const SliderKZ = require('./providers/sliderkz')
const MusicPleer = require('./providers/musicpleer')
const YoutubeInMp3 = require('./providers/youtubeinmp3')

find = process.argv.filter( utils.getFind ).join('+')

const events = require('events')
const eventEmitter = new events.EventEmitter()

console.log(`\n\n\n\t\t INICIANDO A BUSCA PARA: ${find} ` )

const foi = fs.ensureDirSync( PATH )

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

    songs.map( ( song, key ) => {
        question1.choices.push( { name: song.tit_art } )
        if ( !artists.includes( song.artist ) && song.artist != '' ) {
          artists.push( song.artist  )
        }

        question1.choices.push( { name: entities.decode(song.tit_art) })
    })

    const artist = ( artists.length > 1 ) ? artists.reduce( utils.findBestArtistMatch ) : artists[0]

    inquirer.prompt([
      question1
    ]).then( ( answers ) => {
        return cb( null, {
            artist: artist,
            songs: songs
            .filter((song) => answers.songs.includes(entities.decode(song.tit_art)))
            .filter(utils.removeDupes)
          }
        )
    });

  }

Promise.enhancedRace([
  //MusicPleer.search(find),
  SliderKZ.search(find),
  YoutubeInMp3.search(find)
]).then(resp => {

  resp.songs.then((songs) => {
      choose(songs, (err, response) => {

        ( !response.songs )
          ? console.log("não foi escolhido/encontrado nenhuma música")
          : response.songs.map( el => {

              const ARTISTPATH = PATH + entities.decode(response.artist).replace('/', '_')
              const title = entities.decode(el.tit_art)
              const cb = (err) =>
              err
                  ? console.log('Nao rolou criar as pastas aqui', err)
                  : resp.download(title, entities.decode(el.url), ARTISTPATH+'/'+utils.decodeHTMLEntities(title+'.mp3'))

              Promise.
                all([{
                  then: (resolve, reject) => {
                    utils.ensureExists(PATH, 0744, (err) => {
                      return resolve(0)
                    })
                  }
                }, {
                  then: (resolve, reject) => utils.ensureExists(ARTISTPATH, 0744, (err) => resolve(err))
                }])
                //artist folder
                .then(err => (err.reduce((f, s) => f || s)) ? Promise.reject(err) : cb(null))
                .catch(err => cb(err))

            })

          return response.songs
      })
  })
}, function (err) {
  console.log(err)
})
