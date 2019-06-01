# Refactoring

## Providers

### Modelo Padrão

Antes de refatorar irei separar em funcionalidades obrigatórias para que possa ser criada novas *libs* de *providers*.

#### Metodologia

Primeiramente separar as funções existentes no `prototype`, do jeito que estão, para funções separadas/modularizadas para com isso criar um Objeto que represente o mesmo que é exportado atualmente.

#### Padrão

Usarei o modelo BASEADO na `sliderkz.js`!



##### Values:

- BASE {String}: const da url BASE do provider;
- url {String}: `${BASE}/vk_auth.php?&q=`
- page {String}: `&page=0`
- getLinks {Object}:
  - uri {String}: '';
  - headers {Object}: 
    - Content-Type {String}: '';
    - User-Agent {String}: '';
    - Referer {String}: '';

##### Actions

- buildSongs {response => Promise.then}
- prepareForDownload {(title, uri, path, index) => Promise.resolve}
- search {query => Promise.resolve(rp(getLinks)}



### Sliderkz

#### Meta

- trocar `function` por `arrow function`;
- eliminar o `prototype`;
- eliminar o `this`;
- exportar o mesmo Objeto sem mexer no código que já usa e funciona.


### Refatorando Sliderkz

#### Transformando em um Objeto - Primeira etapa

##### Início:

```js
function SliderKZ () {

  this.url = `${BASE}/vk_auth.php?&q=`
  this.page = `&page=0`

  this.buildSongs = (response) => {

    if ( ! response.audios ) return console.log('Songs not found!')

    let pageCount = Object.keys(response.audios)[0]
    const list = response.audios[Object.keys(response.audios)[0]]

    var p = new Promise((resolve, reject) => {

        let newList = list.map(s => {
            s.url = `${BASE}/download/${s.id}/${s.duration}/${s.url}/${s.tit_art}.mp3?extra=${s.extra}`
            s.provider = 'SliderKZ'
            return s
        })
        resolve(newList)
    })

    return p.then((resp) => resp)
  }
}

SliderKZ.prototype.search = function (query) {

  getLinks.uri = [this.url, query].join('');

  let self = this
  return Promise.resolve(rp(getLinks)
    .then(body => {
      return {
        songs: self.buildSongs(body),
        download: self.prepareForDownload
      }
    })
    .catch(err => Promise.reject(err)))
}

SliderKZ.prototype.prepareForDownload = function (title, uri, path, index) {

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
```

<hr>

##### Final:

```js

const PROVIDER = () => {
  let url = `${BASE}/vk_auth.php?&q=`
  let page = `&page=0`

  const buildSongs = (response) => {

    if ( ! response.audios ) return console.log('Songs not found!')

    let pageCount = Object.keys(response.audios)[0]
    const list = response.audios[Object.keys(response.audios)[0]]

    const p = new Promise((resolve, reject) => {

        let newList = list.map(s => {
            s.url = `${BASE}/download/${s.id}/${s.duration}/${s.url}/${s.tit_art}.mp3?extra=${s.extra}`
            s.provider = 'SliderKZ'
            return s
        })
        resolve(newList)
    })

    return p.then((resp) => resp)
  }


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
    console.log('search: ', {getLinks})
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
  

  const lib = {
    buildSongs,
    prepareForDownload,
    search
  }
  return lib
}
```