const fs = require(`fs`)
const rp = require(`request-promise`)
const PATH = __dirname + '/musics'
const find = process.argv.filter(el => !el.includes('/')).join('+')
const page = `&page=0`
const BASE = `http://slider.kz`
const uri = `${BASE}/new/include/vk_auth.php?act=source1&q=${find}`
const inquirer = require('inquirer')

const events = require('events')
const eventEmitter = new events.EventEmitter()

function decodeHTMLEntities (str) {
  if(str && typeof str === 'string') {
    // strip script/html tags
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

const choose = (songs, cb) => {

    const question1 = {
        type: 'checkbox',
        message: 'Selecione as canções',
        name: 'songs',
        choices: [
          new inquirer.Separator(' = As sonzeiras = ')
        ],
        validate: function (answer) {
          if (answer.length < 1) {
            
          }
          return true;
        }
    }

    songs.map((song, key) => {
        question1.choices.push({ name: song.title })
    })

    inquirer.prompt([
      question1
    ]).then((answers) => {
        return cb(null, songs
        .filter((song) => { return answers.songs.includes(song.title) })
        .map((song) => song))
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

        console.log(`\n\t\t recebi a lista de ${list.feed.length} mp3s ... `)
        console.log(`\n\t\t MAS BAIXAREI APENAS AS QUE VC ESCOLHER `)
        // console.log(`\n\t\t agora salvarei no banco ... `)
        // console.log(`\n\t\t enquanto baixo TODAS ELAS ... `)

        const listToSave = list.feed.map( el => el.entry )

        choose(listToSave, (err, songs) => {

            songs 
                ? songs.map( el => {
                    const PATH = __dirname +'/musics/'+el.artist.replace('/', '_')
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
                            .pipe(fs.createWriteStream(PATH+'/'+decodeHTMLEntities(el.tit_art+'.mp3')))
                            .on( `finish`, () => {
                                console.log(`\t\t\t Baixada: ${el.tit_art}.mp3`)
                                console.timeEnd(`tempo para baixar ${el.tit_art}.mp3`)
                                // process.exit(1) 
                            })

                    // console.log('PATH', PATH)
                    ensureExists( PATH, 0744, cb)
                    }
                    )
                : console.log("não foi escolhido/encontrado nenhuma música")
            
            return songs;
        })

        return false;
    })
    .then( body => {
        // console.log(`\n\n\n\t\t SALVEI A PORRA TODA NO BANCO`, body)
        // console.timeEnd('tempo para baixar TODAS as musicas')
        // process.exit(1) 

    })
    .catch( err => {
        // API call failed... 
        console.log(`err`, err)
    })
    // .finally( () => {
    //     // API call failed... 
    //     console.log(`Por hoje eh soh pesoal!`)
    // })