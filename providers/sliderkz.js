'use strict'

const rp = require(`request-promise`)
const fs = require('fs')
const BASE = `https://slider.kz`
const PROVIDER = 'SliderKZ'

const getLinks = {
  uri: '',
  headers: {
      'Content-Type': `application/json`,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
      'Referer': 'https://slider.kz/'
  },
  json: true
}

const existsProp = (prop) => ({ in: (obj) => !obj[prop]})
const getPageCount = (obj) => Object.keys(obj)[0]
const getList = (provider = PROVIDER) => (obj) => {
  obj.url = `${BASE}/download/${obj.id}/${obj.duration}/${obj.url}/${obj.tit_art}.mp3?extra=${obj.extra}`
  obj.provider = provider
  return obj
}

const buildSongs = (response) => {

  if ( existsProp('audios').in(response) ) return console.log('Songs not found!')
  
  const list = response.audios[getPageCount(response.audios)]

  const p = new Promise((resolve, reject) => {

  const newList = list.map(getList())
  // let newList = list.map(s => {
  //     s.url = `${BASE}/download/${s.id}/${s.duration}/${s.url}/${s.tit_art}.mp3?extra=${s.extra}`
  //     s.provider = 'SliderKZ'
  //     return s
  // })
    resolve(newList)
  })

  return p.then((resp) => resp)
}

const LIB = () => {
  let url = `${BASE}/vk_auth.php?&q=`
  let page = `&page=0`


  const prepareForDownload = (title, uri, path, index) => {

    let self = this
    getLinks.uri = uri
  
    return new Promise((resolve, reject) => {
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
                  resolve()
              });
            })
            .on(`error`, (err) =>
              multi.write(`got a problem downloading: ${title} \n`))
          //.pipe(fs.createWriteStream())
          .pipe(fs.createWriteStream(path))
          .on( `finish`, () => {
          })
    })
  
  }

  const search = (query) => {

    getLinks.uri = [url, query].join('');
    // console.log('search: ', {getLinks})
    let self = this
  
    return Promise.resolve(rp(getLinks)
      .then(body => {
        return {
          songs: buildSongs(body),
          download: prepareForDownload
        }
      })
      .catch(err => Promise.reject(err)))
  }
  

  const actions = {
    buildSongs,
    prepareForDownload,
    search
  }
  return actions
}

module.exports = LIB()
