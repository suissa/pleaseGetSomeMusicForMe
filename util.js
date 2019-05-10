const fs = require('fs')
const Entities = require('html-entities').AllHtmlEntities
const entities = new Entities()

var getIndex = ( s, song ) => entities.decode(s.tit_art) == entities.decode(song.tit_art)

Promise.enhancedRace = function(promises) {
  if (promises.length < 1) {
    return Promise.reject('não há buscadores');
  }
  // There is no way to know which promise is rejected.
  // So we map it to a new promise to return the index when it fails
  let indexPromises = promises.map((p, index) => p.catch(() => {throw index;}));
  return Promise.race(indexPromises).catch(index => {
    // The promise has rejected, remove it from the list of promises and just continue the race.
    let p = promises.splice(index, 1)[0];
    p.catch(e => console.log('err', e));
    return Promise.enhancedRace(promises);
  })
}


module.exports = {
  getFind: ( el ) => !el.includes( '/' ) && !el.includes( '\\' ),

  findBestArtistMatch: ( str, anotherString ) => {
    //TODO: improve validation
    if ( str.length > anotherString.length ) {
      let match = new RegExp( str, 'i' ).test( find.replace( '+', ' ' ) )

      if (!match) {
          return anotherString
      }
    }

    return str
  },

  decodeHTMLEntities: ( str ) => {

    if( str && typeof str === 'string' ) {
      str = str.replace( /<script[^>]*>([\S\s]*?)<\/script>/gmi, '' )
      str = str.replace( /<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '' )
      str = str.replace( /&#x[A-Z][0-9]/gmi, '' )
    }
    return str
  },

  ensureExists: ( path, mask, cb ) => {
    if ( typeof mask === 'function' ) {
      cb = mask
      mask = 0777
    }
    fs.mkdir( path.replace('"', '').replace('"', ''), mask, (err) =>
      ( err )
        ? ( err.code == 'EEXIST' ) ? cb( null ) : cb( err )
        : cb( null )
    )
  },

  removeDupes: (song, i, self) => {
    return ( self.length > 1 ) ? self.findIndex( s => getIndex( s, song ) ) === i : true
  }

}
