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

##### Final 1:

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


##### Final 2: modularizando a função buildSongs

Perceba que ela só necessita **MESMO** do Objeto `response` para funcionar, logo podemos apenas recortar ela e colar fora do nosso Objeto `PROVIDER`:

```js

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

```


##### Final 2: refatorando a função buildSongs

Logo no começo temos um teste lógico que verifica a existência da propriedade `audios` no Objeto `response`, logo podemos refatorar esse teste para a seguinte função:

```js
const existsProp = (prop) => ({ in: (obj) => !obj[prop]})
 ```

E utilizá-la da seguinte forma:


```js
// OLD
// if ( !response.audios ) return console.log('Songs not found!')

// NEW
if ( existsProp('audios').in(response) ) return console.log('Songs not found!')
 ```



##### Final 2: Criando a função getPageCount

Agora iremos criar uma função nova que irá apenas encapsular o uso de uma função específica do JS para que a leitura final seja mais simples e semântica, pois veja o que temos:

```js
let pageCount = Object.keys(response.audios)[0]
const list = response.audios[Object.keys(response.audios)[0]]

// que deveria ser
const list = response.audios[pageCount]
```

Se criar uma função específica para isso nosso código pode ser mais facilmente recriado em outra linguagem pois a utilização da função específica será diferente, logo deixamos assim:

```js
const getPageCount = (obj) => Object.keys(obj)[0]
```

E utilizamos da seguinte forma:

```js
const list = response.audios[getPageCount(response.audios)]
```

Ou seja, já eliminamos a necessidade de chamar 2x a mesma lógica e eliminamos a necessidade da variável `pageCount`, **pois se vc analisar o código ela nem era usada!!!**


##### Final 2: Modularizando a função do map

Temos o seguinte código, porém o interessante é encapsular essa lógica do `map` em uma funçnao externa e modularizada:

```js
let newList = list.map(s => {
    s.url = `${BASE}/download/${s.id}/${s.duration}/${s.url}/${s.tit_art}.mp3?extra=${s.extra}`
    s.provider = 'SliderKZ'
    return s
})
```

Logo podemos apenas recortar o que temos dentro do `map()` para:

```js
const getList = (obj) => {
  obj.url = `${BASE}/download/${obj.id}/${obj.duration}/${obj.url}/${obj.tit_art}.mp3?extra=${obj.extra}`
  obj.provider = 'SliderKZ'
  return obj
}
```

E utilizar asssim:

```js
const newList = list.map(getList)
```

Contudo podemos refatorar um pouco mais para deixar essa função mais genérica para diferentes *providers*, fazendo o seguinte:

- primeiro criando uma constante no início do arquivo com o nome do *prvider*:
  - `const PROVIDER = 'SliderKZ'`
- depois adicionando esse valor como entrada para essa função, porém para isso **precisamos** criar uma closure da seguinte forma:
  - `const getList = (provider = PROVIDER) => (obj) =>`

Percebeu que utilizei [Default Parameters]() já definindo o valor que criamos anterioremente.

Nesse caso seu uso será assim:

```js
// direto sem passar o valor
const newList = list.map(getList())

// passando aquela constante inicial
const newList = list.map(getList(PROVIDER))

// passando um valor diferente
const newList = list.map(getList('NovoProvider'))
```


```js
const p = new Promise((resolve, reject) => {
  // const newList = list.map(getList())
  return resolve(list.map(getList()))
})
```

**Agora percebendo que possuímos apenas 1 linha dentro da `Promise` que dá um `return` podemos refatorarr para deixar isso em apenas 1 linha**:

```js
const p = new Promise((resolve, reject) => resolve(list.map(getList())))
```

Como utilizamos o valor `list` pro `map` nós também podemos refatorar para uma função:

```js
const getSongs = (obj) => obj[getPageCount(obj)]
```

Para deixar nossa `Promise` assim:

```js
return new Promise((resolve, reject) => resolve(getSongs(response.audios).map(getList())))
            .then((resp) => resp)
```

> Agora olhe como está nossa função `buildSongs` atual:

```js
const buildSongs = (response) => {

  if ( existsProp('audios').in(response) ) return console.log('Songs not found!')
  
  return new Promise((resolve, reject) => resolve(getSongs(response.audios).map(getList())))
              .then((resp) => resp)
}
```

**Percebendo que possuímos apenas um `if` e logo após o `return` podemos transformar ela em uma função de uma linha apenas:**

```js
const buildSongs = (response) => 
  ( existsProp('audios').in(response) ) 
    ? console.log('Songs not found!')
    : new Promise((resolve, reject) => resolve(getSongs(response.audios).map(getList())))
      .then((resp) => resp)
```

Uma dica que eu dou é sempre encapsular a lógica utilizada no if ternário, assim:

```js
const buildSongs = (response) => 
  ( existsProp('audios').in(response) ) 
    ? songsNotFound()
    : songsFounded(response.audios)
```

Para conseguir esse resultado basta encaspsular as 2 lógicas da seguinte forma:

```js
const songsNotFound = () => console.log('Songs not found!')
const songsFounded = (obj) => 
  new Promise((resolve, reject) => resolve(getSongs(obj).map(getList())))
    .then((resp) => resp)
```


<hr>

```js
const PROVIDER = () => {
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