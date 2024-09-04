const apiUrl = 'http://localhost:3000';


function toggleMenu(x) {
  x.classList.toggle("change");
  var sidebar = document.getElementById("mySidebar");
  var main = document.getElementById("main");
  if (sidebar.style.width === "200px") {
    sidebar.style.width = "0";
    main.style.marginLeft = "100px";
    main.style.transition = `margin-left .5s ease`;

  } else {
    main.style.transition = `margin-left .5s ease`;
    sidebar.style.width = "200px";
    main.style.marginLeft = "200px";

  }
}

function LoggedIn() {
  var user = sessionStorage.getItem("user");
  if (user === null || user === undefined) {
      window.location.href = "login.html";
  }
  else {
      return true;
  }

}

// Ottengo il token e lo salvo in accessToken
const clientId = '94ec9b6c3d904d2ea642c0a7dc18a0a2';
const clientSecret = 'a5fa1c056a1349c8ae61bdac9fa073f7';

let accessToken = "";

function getToken() {
  return fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
    },
    body: 'grant_type=client_credentials'
  })
  .then(response => {
    if (!response.ok) {
      alert('Errore nel recupero del token');
    }
    return response.json();
  })
  .then(data => {
    accessToken = data.access_token; // Memorizza il token nella variabile
    return accessToken;
  })
  .catch(error => {
    console.error('Errore:', error);
  });
}
getToken();


//pagina register
const maxSelection = 3;
const maxGSelection = 3;
let selectedArtists = [];
let allArtists = [];
let selectedGenres = [];
let allGenres = [];


async function searchArtists() {
  const query = document.getElementById('search').value;
  if (query.length < 3) return; // Inizia la ricerca solo se la query è lunga almeno 3 caratteri

  const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    console.error('Errore durante il recupero degli artisti:', response.statusText);
    return;
  }

  const data = await response.json();
  allArtists = data.artists.items;
  displayArtists(allArtists);
}

function displayArtists(artists) {
  const grid = document.getElementById('artist-grid');
  grid.innerHTML = '';

  artists.forEach(artist => {
    const artistDiv = document.createElement('div');
    artistDiv.className = 'artist' + (selectedArtists.some(a => a.id === artist.id) ? ' selected' : '');
    artistDiv.onclick = () => toggleASelect(artistDiv, artist);

    const img = document.createElement('img');
    img.src = artist.images[0] ? artist.images[0].url : 'https://via.placeholder.com/100';
    img.alt = artist.name;

    const nameDiv = document.createElement('div');
    nameDiv.className = 'artist-name';
    nameDiv.textContent = artist.name;

    const checkmarkDiv = document.createElement('div');
    checkmarkDiv.className = 'checkmark';
    checkmarkDiv.textContent = '✓';

    artistDiv.appendChild(checkmarkDiv);
    artistDiv.appendChild(img);
    artistDiv.appendChild(nameDiv);
    grid.appendChild(artistDiv);
  });

    updateSelectedArtistsDisplay();
}

function toggleASelect(element, artist) {
  const index = selectedArtists.findIndex(a => a.id === artist.id);
  if (element.classList.contains('selected')) {
    element.classList.remove('selected');
    if (index > -1) {
      selectedArtists.splice(index, 1);
    }
  } else {
    if (selectedArtists.length >= maxSelection) {
      document.getElementById('error-message').style.display = 'block';
      return;
    }
    element.classList.add('selected');
    selectedArtists.push(artist);
    document.getElementById('error-message').style.display = 'none';
  }

  updateSelectedArtistsDisplay();
}

function updateSelectedArtistsDisplay() {
  const selectedArtistsContainer = document.getElementById('selected-artists');
  selectedArtistsContainer.innerHTML = '';

  selectedArtists.forEach(artist => {
    
    const artistDiv = document.createElement('div');
    artistDiv.className = 'selected-artist';

    const img = document.createElement('img');
    img.src = artist.images[0] ? artist.images[0].url : 'https://via.placeholder.com/120';
    img.alt = artist.name;

    const nameDiv = document.createElement('div');
    nameDiv.className = 'artist-name';
    nameDiv.textContent = artist.name;

    artistDiv.appendChild(img);
    artistDiv.appendChild(nameDiv);
    selectedArtistsContainer.appendChild(artistDiv);
  });

  selectedArtistsContainer.style.display = selectedArtists.length > 0 ? 'grid' : 'none';
}

function confirmSelection() {
    if (selectedArtists.length > maxSelection) {
      document.getElementById('error-message').style.display = 'block';
      return;
    }

    document.querySelector('.search-bar').style.display = 'none';
    document.getElementById('artist-grid').classList.add('hidden');
    document.getElementById('confirm-button').classList.add('hidden');
    document.getElementById('edit-button').classList.remove('hidden');
}

function editSelection() {
    document.querySelector('.search-bar').style.display = 'block';
    document.getElementById('artist-grid').classList.remove('hidden');
    document.getElementById('confirm-button').classList.remove('hidden');
    document.getElementById('edit-button').classList.add('hidden');

    // Ripristina la visualizzazione degli artisti con le selezioni precedenti
    displayArtists(allArtists);
}

async function searchGenres() {
  const query = document.getElementById('search-gen').value.toLowerCase();
  if (query.length < 3) return; // Inizia la ricerca solo se la query è lunga almeno 3 caratteri

  if (allGenres.length === 0) {
    const response = await fetch('https://api.spotify.com/v1/recommendations/available-genre-seeds', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      console.error('Errore durante il recupero dei generi:', response.statusText);
      return;
    }

    const gen = await response.json();
    allGenres = gen.genres;
  }

  const filteredGenres = allGenres.filter(genre => genre.includes(query));
  displayGenres(filteredGenres);
}

function displayGenres(genres) {
  const list = document.getElementById('genre-list');
  list.innerHTML = ''; // Svuota la lista prima di aggiungere nuovi generi

  genres.forEach(genre => {
    const genreDiv = document.createElement('div');
    genreDiv.className = 'genre' + (selectedGenres.includes(genre) ? ' selected-gen' : '');
    genreDiv.onclick = () => toggleSelect(genreDiv, genre);

    const nameGDiv = document.createElement('div');
    nameGDiv.className = 'genre-name';
    nameGDiv.textContent = genre;

    genreDiv.appendChild(nameGDiv);
    list.appendChild(genreDiv);
  });

  updateSelectedGenresDisplay();
}

function toggleSelect(element, genre) {
  const index = selectedGenres.indexOf(genre);
  if (element.classList.contains('selected-gen')) {
      element.classList.remove('selected-gen');
      if (index > -1) {
          selectedGenres.splice(index, 1);
      }
  } else {
    if (selectedGenres.length >= maxGSelection) {
      document.getElementById('error-message-gen').style.display = 'block';
      return;
    }
    element.classList.add('selected-gen');
    selectedGenres.push(genre);
    document.getElementById('error-message-gen').style.display = 'none';
  }

  updateSelectedGenresDisplay();
}

function updateSelectedGenresDisplay() {
  const selectedGenresContainer = document.getElementById('selected-genres-gen');
  selectedGenresContainer.innerHTML = '';

  selectedGenres.forEach(genre => {
    
    const genreDiv = document.createElement('div');
    genreDiv.className = 'selected-genre-gen';
    genreDiv.textContent = genre;

    selectedGenresContainer.appendChild(genreDiv);
  });

  selectedGenresContainer.style.display = selectedGenres.length > 0 ? 'flex' : 'none';
}

function confirmGSelection() {
  if (selectedGenres.length > maxGSelection) {
    document.getElementById('error-message-gen').style.display = 'block';
    return;
  }

  document.querySelector('.search-bar-gen').style.display = 'none';
  document.getElementById('genre-list').classList.add('hidden');
  document.getElementById('confirm-button-gen').classList.add('hidden');
  document.getElementById('edit-button-gen').classList.remove('hidden');
}

function editGSelection() {
  document.querySelector('.search-bar-gen').style.display = 'block';
  document.getElementById('genre-list').classList.remove('hidden');
  document.getElementById('confirm-button-gen').classList.remove('hidden');
  document.getElementById('edit-button-gen').classList.add('hidden');

  // Ripristina la visualizzazione dei generi con le selezioni precedenti
  displayGenres(allGenres);
}

function getSelectedArtistsData() {
  return selectedArtists.map(artist => ({
      id: artist.id,
      name: artist.name,
      images: artist.images
  }));
}

function getSelectedGenereData() {
  return selectedGenres.map(genre => ({
      name: genre
  }));
}





// nuovo utente
function newUser() {

  var usernameInput = document.getElementById('username');
  var passwordInput = document.getElementById('password');
  var emailInput = document.getElementById('email');
  var sexInput = document.getElementById('sex');


  const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };
  if (!isValidEmail(emailInput.value)) {
    alert("Questa Email non è valida, inserisci una mail valida.");
    return
  }

  var data = {
    username: usernameInput.value,
    password: passwordInput.value,
    email: emailInput.value,
    sex: sexInput.value,
    artists: getSelectedArtistsData(),
    genere: getSelectedGenereData()
  };

  // Fetch API call -> invia data al server
  fetch(`${apiUrl}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  .then(response => {
    if (response.ok) {
      // Registazione avvenuta -> login.html
      console.log("Registrazione avvenuta con successo!");
      window.location.href = "login.html"; 
    } else {
      // Errore nella registazione -> messaggio di errore
      response.json().then(errorData => {
        alert("Errore nella registrazione: " + errorData.message);
      });
    }
  })
  .catch(error => {
    // Problemi di rete -> controlla il server!
    alert("Errore di rete. Riprova più tardi.");
  });
}

// pagina login
function login() {

  var emailInput = document.getElementById('email').value
  var passwordInput = document.getElementById('password').value

  var data = {
    email: emailInput,
    password: passwordInput
  };

  // Fetch API call -> invia data al server
  fetch(`${apiUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (response.status === 401) {
      // Non registrato o Email o Password sbagliate
      alert('Email o Password sbagliate.');
      return null;
    } else {
      return response.json();
    }
  })
  .then(logged => {
    if (logged) {
      sessionStorage.setItem("user", JSON.stringify(logged));
      window.location.href = "profilo.html";
    }
  })
}

// cancella il profilo utente
function addioUser() {

  const userJSON = sessionStorage.getItem("user");
  const data = JSON.parse(userJSON);
  

  fetch(`${apiUrl}/delete`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data)
  })
  .then((response) => {
    if (response.status == 401) {
      alert('Token scaduto, rieffettuare il login');
      window.location.href = 'login.html';
      return;
    }
    if (!response.ok) {
      alert('Errore durante la cancellazione');
      return;
    }
    else{
      alert('Utente cancellato con successo.');
      logout();
    }
  })
}

// Esci dal profilo
function logout() {
  sessionStorage.removeItem("user");
  window.location.href = "login.html";
}


// modifica profilo
function modificauser() {

  const userJSON = sessionStorage.getItem("user");
  const user = JSON.parse(userJSON);
  
  var username = document.getElementById('username');
  var emailInput = document.getElementById('email');
  var newPassword1 = document.getElementById('Password1');
  var newPassword2 = document.getElementById('Password2');

  //alert("Username: " + username.value + "\nEmail: " + emailInput.value + "\nNew Password: " + newPassword1.value + "\nNew Password2: " + newPassword2.value);
  // Use existing values if input is empty
  if (!username) {
    alert("Il campo username e' vuoto");
    return
  }

  const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };
  if (!isValidEmail(email.value)) {
    alert("Questa Email non è valida, inserisci una mail valida.");
    return
  }

  var data = {
    _id: user._id,
    username: username.value,
    email: emailInput.value,
    artists: getSelectedArtistsData(),
    genere: getSelectedGenereData(),
  };

  if (newPassword1.value != "" && newPassword2.value != "") {
    if (newPassword1.value.length < 8 || newPassword2.value.length < 8) {
      alert("La password deve essere lunga almeno 8 caratteri.");
      return;
    }

    if (newPassword1.value !== newPassword2.value) {
      alert("Le password non corrispondono.");
      return;
    }
    
    data.password = newPassword1.value;
    //alert(data.password);
  }

  fetch(`${apiUrl}/modificauser`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  }).then(response => {
    if (response.ok) {
      alert("Profilo modificato con successo.\nEseguire il login aggiornato.");
      window.location.href = "login.html";
    } else {
      alert("Nessun cambiamento effettuato");
      return;
    }
  });
}

function selezionati(){
  const userJSON = sessionStorage.getItem("user");
  if (userJSON){
    try {
      const user = JSON.parse(userJSON);
      const UserId = user._id;
  
      fetch(`${apiUrl}/profile/${UserId}`, {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
          },
      })
      .then((response) => {
          if (response.status === 401) {
              alert('Token scaduto, rieffettuare il login.');
              window.location.href = 'login.html';
          } else {
              return response.json();
          }
      }).then(data => {

        selectedGenres = data.genere.map(g => g.name) || [];
        editGSelection();

        selectedArtists = data.artists.map(artist => ({
          id: artist.id || '',
          name: artist.name || '',
          images: artist.images || [],
        }));
        editSelection();
        
      })
      .catch((error) => {
          console.log('Errore:', error);
      });
      
    } catch (error) {
        console.error('Errore:', error);
        //alert(error);
        alert('Errore durante il recupero dei dati. Riprova più tardi.');
    }
  }
  
}

// traccie
async function searchTracks(trackName, artistName) {
  //alert("Nema " +  trackName + "\nartista " + artistName);
  try {
    // Verifica che almeno uno dei parametri sia fornito
    if (!trackName && !artistName) {
      alert("È necessario fornire almeno un nome di brano o un nome di artista per la ricerca.");
      return []; // Esci dalla funzione e restituisci un array vuoto
    }

    // Costruzione della query di ricerca
    var query = '';
    if (trackName) {
      query += `track:${encodeURIComponent(trackName)}`; // Aggiunge il parametro di ricerca del brano
    }
    if (artistName) {
    if (query) query += '+'; // Se entrambi i parametri sono presenti, aggiungi un operatore AND
      query += `artist:${encodeURIComponent(artistName)}`; // Aggiunge il parametro di ricerca dell'artista
    }

    // Effettua la richiesta all'API di Spotify
    const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track`, {
    headers: {
        'Authorization': `Bearer ${accessToken}`
    }
    });


    if (!response.ok) {
        throw new Error('Errore nella richiesta: ' + response.statusText);
    }

    const data = await response.json();
    //alert('API Response:' + JSON.stringify(data, null, 2));

    const tracks = data.tracks.items.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists.map(artist => artist.name).join(', '),
        genre: track.album.genres ? track.album.genres.join(', ') : 'Unknown', // Spotify API non fornisce il genere nelle risposte di ricerca, quindi questo potrebbe non essere sempre disponibile
        image: track.album.images[0].url,
        duration: track.duration_ms,
        releaseDate: track.album.release_date
    }));

    return tracks;

  } catch (error) {
      alert('Errore nella ricerca delle tracce:', error);
      return [];
  }
}


function displayTracks(tracks) {
  const resultsDiv = document.getElementById('searchResults');
  resultsDiv.innerHTML = '';

  if (tracks.length === 0) {
      resultsDiv.innerHTML = '<p>No tracks found.</p>';
      return;
  }

  tracks.forEach(track => {
      const trackElement = document.createElement('div');
      trackElement.classList.add('track');
      trackElement.innerHTML = `
          <img src="${track.image}" alt="${track.name}">
          <div>
              <p><strong>${track.name}</strong></p>
              <p>Artista/i: ${track.artist}</p>
              <p>Genre: ${track.genre}</p>
              <p>Durata: ${formatDuration(track.duration)}</p>
              <p>Data di uscita: ${track.releaseDate}</p>
          </div>
          <button onclick="PlayOnetrack('${track.id}', this)">Play</button>
          <button onclick="showPlaylistSelectModal('${track.id}', '${track.duration}')">Aggiungi alla Playlist</button>
      `;
      resultsDiv.appendChild(trackElement);
  });
}


function formatDuration(ms) {
  const hours = Math.floor(ms / 3600000); // Calcola le ore
  const minutes = Math.floor((ms % 3600000) / 60000); // Calcola i minuti rimanenti
  const seconds = Math.floor((ms % 60000) / 1000); // Calcola i secondi rimanenti

  // Costruisci l'output come stringa, mostrando solo i componenti necessari
  let result = '';
  if (hours > 0) {
    result += `${hours} ${hours === 1 ? 'ora' : 'ore'}`;
  }
  if (minutes > 0) {
    if (result) result += ' e '; // Aggiunge "e" solo se ci sono ore già aggiunte
    result += `${minutes} ${minutes === 1 ? 'minuto' : 'minuti'}`;
  }
  if (seconds > 0) {
    if (result) result += ' e '; // Aggiunge "e" solo se ci sono ore o minuti già aggiunti
    result += `${seconds} ${seconds === 1 ? 'secondo' : 'secondi'}`;
  }
  if(hours == 0 && minutes == 0 && seconds == 0){
    result = "0 secondi"
  }
  return result;
}

async function salvaplaylist() {
  const title = document.getElementById('playlist-title').value;
  const description = document.getElementById('playlist-description').value;
  const tags = document.getElementById('playlist-tags').value.split(',').map(tag => tag.trim());
  const isPublic = document.getElementById('playlist-is-public').checked;

  if (!title || !description || !tags) {
    alert('Compila tutti i campi obbligatori!');
    //alert(title);
    return;
  }

  const userJSON = sessionStorage.getItem("user");
  const user = JSON.parse(userJSON);
  const UserId = user._id;

  const responde = await fetch(`${apiUrl}/playlists/${title}/${UserId}`);
  const data = await responde.json();

  if (data.exists) {
    alert('Playlist con questo titolo già esistente!');
    return; // Interrompe l'esecuzione se la playlist esiste già
  }  

  const playlist = {
      title,
      userId: UserId,
      creatorName: user.username, 
      description,
      tags,
      isPublic
  };

  try {
      const response = await fetch(`${apiUrl}/createplaylist`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(playlist)
      });

      const data = await response.json();
      if (response.ok) {
          alert('Playlist created successfully!');
          document.getElementById('playlist-title').value = '';
          document.getElementById('playlist-description').value = '';
          document.getElementById('playlist-tags').value = '';
          document.getElementById('playlist-is-public').checked = false;
          window.location.reload();
      } else {
          alert(`Error: ${data.message}`);
      }
  } catch (error) {
      console.error('Error:', error);
  }
  
}

async function vediplaylist(){
  try {
    const userJSON = sessionStorage.getItem("user");
    const user = JSON.parse(userJSON);
    const UserId = user._id; 

    const response = await fetch(`${apiUrl}/playlists/${UserId}`);
    const playlists = await response.json();

    const playlistsList = document.getElementById('playlists-list');
    playlistsList.innerHTML = '';

    playlists.forEach(playlist => {
      playlistsList.appendChild(stampaPlaylist(playlist));
    });

    playlistsList.classList.remove('hidden');
  } catch (error) {
      console.error('Error:', error);
  }
}


async function deletePlaylist(id) {
  const confirmation = confirm("Sei sicuro di voler eliminare la playlist? Questa azione è irreversibile.");
  if (confirmation) {
    alert("La playlist sarà eliminata.");
    try {
      const userJSON = sessionStorage.getItem("user");
      const user = JSON.parse(userJSON);
      const UserId = user._id;
      const response = await fetch(`${apiUrl}/playlist/${id}/${UserId}`, {
          method: 'DELETE'
      });

      if (response.ok) {
        alert('Playlist deleted successfully!');
        window.location.reload();
      } else {
        const data = await response.json();
        alert(`Error: ${data.message}`);
      }
  } catch (error) {
      console.error('Error:', error);
  }
  } else {
    alert("Eliminazione annullata.");
  }
  
}


function showPlaylistSelectModal(trackId, trackD) {
  document.getElementById("playlistSelectModal").classList.remove('hidden');
  const modal = document.getElementById("playlistSelectModal");
  const playlistsDiv = document.getElementById("playlistsForSelection");

  playlistsDiv.innerHTML = ''; // Clear previous content

  const userJSON = sessionStorage.getItem("user");
  const user = JSON.parse(userJSON);
  const UserId = user._id;

  fetch(`${apiUrl}/playlists/${UserId}`)
  .then(response => response.json())
  .then(playlists => {
  playlists.forEach(playlist => {
    const playlistItem = document.createElement('div');
    playlistItem.classList.add('item-playlist');
    playlistItem.innerHTML = `
      <h3>${playlist.title}</h3>
      <p>${playlist.description}</p>
      <p><strong>Tags:</strong> ${playlist.tags.join(', ')}</p>
      <p><strong>Numero Tracce:</strong> ${playlist.tracks.length}</p>
      <p><strong>Durata:</strong> ${formatDuration(playlist.duration)}</p>
      <p><strong>Creata da:</strong> ${playlist.creatorName}</p>
      <p><strong>Visibilità:</strong> ${playlist.isPublic ? 'Playlist Publica' : 'Playlist Privata'}</p>
      <button id="vedi-playlist" onclick="openPlaylist('${playlist._id}')">Vedi playlist</button>
      <button onclick="startAddTrackToPlaylist('${playlist._id}', '${trackId}', '${trackD}')">Aggiungi alla Playlist</button>
    `;
      playlistsDiv.appendChild(playlistItem);
  });
  
  modal.style.display = "block";
  })
  .catch(error => console.error('Error fetching playlists:', error));
}



function closeModal() {
  document.getElementById("playlistSelectModal").style.display = "none";
}

  

function startAddTrackToPlaylist(playlistId, trackId, trackDuration) {
  fetch(`${apiUrl}/playlist/${playlistId}/track/${trackId}/${trackDuration}`, {
      method: 'POST',
  })
  .then(response => response.json())
  .then(data => {
      if (data.message === 'Track added successfully') {
      alert('La canzone è stata aggiunta nella playlist!');
      closeModal();
      } else {
      alert('La canzone è gia presente nella playlist');
      }
  }).catch(error => console.error('Error adding track:', error));
}

function RemoveToPlaylist(playlistId, trackId, trackDuration) {
  fetch(`${apiUrl}/playlist/${playlistId}/track/${trackId}/${trackDuration}`, {
      method: 'DELETE',
  })
  .then(response => response.json())
  .then(data => {
      if (data.message === 'Track removed successfully') {
        alert('La canzone è stata rimossa dalla playlist!');
        window.location.reload();
      } else {
        alert('La canzone non è presente dalla playlist');
      }
  }).catch(error => console.error('Error removing track:', error));
}

//cerca le traccie presenti nella playlist tramite id
async function searchTracksid(trackIds) {
  try {
      await getToken();
      const ids = trackIds.join(',');
      const response = await fetch(`https://api.spotify.com/v1/tracks?ids=${ids}`, {
          headers: {
              'Authorization': `Bearer ${accessToken}`
          }
      });
      
      if (!response.ok) {
        throw new Error('Errore nella richiesta: ' + response.statusText);
      }

      const data = await response.json();
      const tracks = data.tracks.map(track => ({
          id: track.id,
          name: track.name,
          artist: track.artists.map(artist => artist.name).join(', '),
          genre: track.album.genres ? track.album.genres.join(', ') : 'Sconosciuto', // Nota: Spotify API non fornisce il genere nelle risposte di ricerca, quindi potrebbe non essere disponibile
          image: track.album.images[0]?.url,
          duration: track.duration_ms,
          releaseDate: track.album.release_date
      }));
      
      return tracks;

  } catch (error) {
      console.error('Errore nella ricerca delle tracce:', error);
      return [];
  }
}

//Mostra le traccie presenti nella playlist
async function TracksofPlaylist(tracksIds, playlistId) {
  try {
      const tracks = await searchTracksid(tracksIds);
      
      const resultsDiv = document.getElementById('tracksResults');
      resultsDiv.innerHTML = '';

      if (tracks.length === 0) {
          resultsDiv.innerHTML = '<p>No tracks found.</p>';
          return;
      }

      tracks.forEach(track => {
          //alert(track.name);
          const trackElement = document.createElement('div');
          trackElement.classList.add('track');
          trackElement.innerHTML = `
              <img src="${track.image}" alt="${track.name}">
              <div>
                  <p><strong>${track.name}</strong></p>
                  <p>Artista/i: ${track.artist}</p>
                  <p>Genere: ${track.genre}</p>
                  <p>Durata: ${formatDuration(track.duration)}</p>
                  <p>Data di uscita: ${track.releaseDate}</p>
              </div>
              <button style="" id="ascolta-playlist" onclick="playPlaylistTracks('${tracksIds.join(", ")}', '${track.id}')">Ascolta in playlist</button>
              <button onclick="RemoveToPlaylist('${playlistId}', '${track.id}', '${track.duration}')">Rimuovi dalla Playlist</button>
          `;
          resultsDiv.appendChild(trackElement);
      });
      resultsDiv.classList.remove('hidden');
      
  } catch (error) {
      console.error('Errore nella visualizzazione delle tracce:', error);
      document.getElementById('tracksResults').innerHTML = '<p>Errore nella visualizzazione delle tracce.</p>';
  }
}

async function vedipubplaylist() {
  try {
    const userJSON = sessionStorage.getItem("user");
    const user = JSON.parse(userJSON);
    const UserId = user._id;

    // Recupera le playlist dell'utente
    const userPlaylistsResponse = await fetch(`${apiUrl}/playlists/${UserId}`);
    const userPlaylists = await userPlaylistsResponse.json();
    
    // Recupera le playlist pubbliche
    const publicPlaylistsResponse = await fetch(`${apiUrl}/playlists/public/${UserId}`);
    const publicPlaylists = await publicPlaylistsResponse.json();

    // Unisci le due liste, evitando duplicati
    const allPlaylists = [...userPlaylists, ...publicPlaylists];

    // Mostra le playlist nel DOM
    const playlistsList = document.getElementById('playlists-lista');
    playlistsList.innerHTML = '';

    allPlaylists.forEach(playlist => {
      playlistsList.appendChild(stampaPlaylist(playlist));
    });

    playlistsList.classList.remove('hidden');
  } catch (error) {
    console.error('Error:', error);
  }
}


async function copyPlaylist(playlistId, newTitle, newDescription) {
  
  try {
      const userJSON = sessionStorage.getItem("user");
      const user = JSON.parse(userJSON);
      const UserId = user._id;

      // Recupera i dettagli della playlist pubblica
      const response = await fetch(`${apiUrl}/playlist/${playlistId}`);
      const playlist = await response.json();

      newDescription += playlist.description;
      newTitle = playlist.title + " (copia)";
      // Crea una nuova playlist con le informazioni aggiornate
      const newPlaylist = {
          title: newTitle,
          userId: UserId,
          creatorName: user.username,
          description: playlist.description,
          numberOfTracks: playlist.numberOfTracks,
          duration: playlist.duration,
          tracks: playlist.tracks,
          tags: playlist.tags,
          isPublic: false // La copia sarà privata per default
      };

      // Invia la nuova playlist al server per salvarla
      const createResponse = await fetch(`${apiUrl}/createplaylist`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(newPlaylist)
      });

      const result = await createResponse.json();
      if (createResponse.ok) {
          alert('Playlist copiata con successo!');
      } else {
          alert('Errore nella copia della playlist: ' + result.message);
      }
  } catch (error) {
      console.error('Error:', error);
  }
}


let currentTrackIndex = 0;
let trackIdsarray = []; // Array di Track IDs
let playerDiv;

let currentlyPlayingTrackId = null;
let currentlyPlayingButton = null;

// traccia singola
function PlayOnetrack(trackId, button){

  if ((currentlyPlayingTrackId !== null) && (currentlyPlayingTrackId !== trackId)) {
    currentlyPlayingButton.textContent = 'Play';
    playerDiv.innerHTML = "";
  }

  currentlyPlayingButton = button;
  currentlyPlayingTrackId = trackId;

  if (button.textContent === 'Play') {
      playTrack(trackId);
      button.textContent = 'Stop';
  } else {
      button.textContent = 'Play';
      playerDiv.innerHTML = "";
      return;
  }
}

function playTrack(trackId) {
  playerDiv = document.getElementById('spotifyPlayer'); // Div per contenere il player
  playerDiv.innerHTML = ''; // Svuota il div prima di aggiungere un nuovo player

  const iframe = document.createElement('iframe');
  iframe.src = `https://open.spotify.com/embed/track/${trackId}?theme=0`;
  iframe.width = '100%';
  iframe.height = '80';
  iframe.frameBorder = '0';
  iframe.allowtransparency = 'true';
  iframe.allow = 'encrypted-media';
  
  playerDiv.appendChild(iframe);

}


// Ascolta tutta la Playlist
function playPlaylistTracks(trackIdsString, ctrackid) {
  const bottone = document.getElementById('play-stop');
  if ( (bottone.classList.contains('bi-play-fill') && ctrackid) || (bottone.classList.contains('bi-play-fill') || ctrackid) ) {
    bottone.classList.remove('bi-play-fill');
    bottone.classList.add('bi-pause-fill');
    document.getElementById('next').classList.remove('hidden');
    document.getElementById('prev').classList.remove('hidden');
    trackIdsarray = trackIdsString.split(',').map(id => id.trim());
    if(ctrackid){
      currentTrackIndex = trackIdsarray.indexOf(ctrackid);
    }else{
      currentTrackIndex = 0;
    }
    playCurrentTrack();
  } else {
    bottone.classList.remove('bi-pause-fill');
    bottone.classList.add('bi-play-fill');
    document.getElementById('next').classList.add('hidden');
    document.getElementById('prev').classList.add('hidden');
    currentTrackIndex = 0;
    playerDiv.innerHTML = '';
    return;
  }
  /*const button = document.getElementById('ascolta-playlist');
  if (button.textContent === 'Ascolta playlist') {
    button.textContent = 'Stoppa Playlists';
    document.getElementById('next').classList.remove('hidden');
    document.getElementById('prev').classList.remove('hidden');
  } else {
    button.textContent = 'Ascolta playlist';
    document.getElementById('next').classList.add('hidden');
    document.getElementById('prev').classList.add('hidden');
    currentTrackIndex = 0;
    playerDiv.remove();
    return;
  }*/
  
}

function playCurrentTrack() {
  if (currentTrackIndex >= trackIdsarray.length) {
    // Tutte le tracce sono state riprodotte
    return;
  }

  playerDiv = document.getElementById('spotifyPlayer'); // Div per contenere il player
  playerDiv.innerHTML = ''; // Svuota il div prima di aggiungere un nuovo player

  const trackId = trackIdsarray[currentTrackIndex];
  const iframe = document.createElement('iframe');
  iframe.src = `https://open.spotify.com/embed/track/${trackId}?theme=0`;
  iframe.width = '100%';
  iframe.height = '80';
  iframe.frameBorder = '0';
  iframe.allowtransparency = 'true';
  iframe.allow = 'encrypted-media';
  
  playerDiv.appendChild(iframe);

}


// Funzione per andare avanti nella traccia
function nextTrack() {
  if (currentTrackIndex >= (trackIdsarray.length - 1)) {
    alert("Sei all'ultima traccia.");
    return;
  }
  else{
    currentTrackIndex++;
    playCurrentTrack();
  }
  
}

// Funzione per tornare indietro nella traccia
function previousTrack() {
  if (currentTrackIndex == 0) {
    alert("Sei alla prima traccia.");
    return;
  }
  else{
    currentTrackIndex--;
    playCurrentTrack();
  }
}

let resultsDivx;

// vedi le canzoni per decidere quale cercare nelle playlist
function displayTracksxPlaylist(tracks) {
  resultsDivx = document.getElementById('searchResults');
  resultsDivx.innerHTML = '';

  if (tracks.length === 0) {
    resultsDivx.innerHTML = '<p>No tracks found.</p>';
    return;
  }

  tracks.forEach(track => {
      const trackElement = document.createElement('div');
      trackElement.classList.add('track');
      trackElement.innerHTML = `
          <img src="${track.image}" alt="${track.name}">
          <div>
              <p><strong>${track.name}</strong></p>
              <p>Artista/i: ${track.artist}</p>
              <p>Genre: ${track.genre}</p>
              <p>Durata: ${formatDuration(track.duration)}</p>
              <p>Data di uscita: ${track.releaseDate}</p>
          </div>
          <button onclick="PlayOnetrack('${track.id}', this)">Play</button>
          <button id="cercalo" onclick="xRicercaP('${track.id}','${track.name}')"> Cerca nelle Playlist</button>
      `;
      resultsDivx.appendChild(trackElement);
  });
}


let playlistsList;


// Cerca playlist in base ai tags e alle canzoni
async function trovaplaylist(trackId, tags) {
  try {
    const userJSON = sessionStorage.getItem("user");
    const user = JSON.parse(userJSON);
    const UserId = user._id; 

    const response = await fetch(`${apiUrl}/playlist/${UserId}`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ tags, trackId }) // Invia i dati come JSON
    });

    if (!response.ok) {
      if (response.status === 400) {
        alert("Inserisci un tag o seleziona una canzone");
      }
      if (response.status === 404) {
        alert("Nessna Playlist trovata");
      }
    }
  
    const playlists = await response.json(); // Converte la risposta in JSON

    playlistsList = document.getElementById('playlists-lista');
    playlistsList.innerHTML = '';

    playlists.forEach(playlist => {
      playlistsList.appendChild(stampaPlaylist(playlist));
    });

    playlistsList.classList.remove('hidden');

  } catch (error) {
    console.error('Errore:', error); // Stampa l'errore nella console
  }
}


async function mostrano(playlistId) {
  try {
    //const playlistId = "66d0e6908f264fdece446ec1"; // Definisci l'ID della playlist
    const response = await fetch(`${apiUrl}/playlist/${playlistId}`); // Esegui una richiesta per ottenere i dettagli della playlist

    // Controlla se la risposta è OK (stato HTTP 200-299)
    if (!response.ok) {
      throw new Error(`Errore: ${response.statusText}`);
    }

    // Converte la risposta JSON in un oggetto JavaScript e assegnalo a Laplaylsit
    const Laplaylsit = await response.json();

    // Salva l'oggetto JSON della playlist nel sessionStorage
    sessionStorage.setItem("playlist", JSON.stringify(Laplaylsit));

    // Mostra l'oggetto JSON recuperato in un alert
    //alert(`Dettagli Playlist:\n${JSON.stringify(Laplaylsit, null, 2)}`); // Usa JSON.stringify per una visualizzazione leggibile

  } catch (error) {
    console.error('Error:', error); // Stampa l'errore nella console
    alert('Errore durante il recupero della playlist'); // Mostra un messaggio di errore all'utente
  }
}


function openPlaylist(playlistId){
  const iframe = document.createElement('iframe');
  iframe.src = `hoverplaylist.html?id=${playlistId}`;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  
  
  const container = document.getElementById('la-playlist-container');
  container.innerHTML = ''; // Pulire il contenitore
  container.appendChild(iframe);
  container.style.display = 'block';
  const bottonechiuso = document.getElementById('sto-close');
  bottonechiuso.classList.remove('hidden');
}


// Funzione per aggiornare una playlist esistente
async function modificaPlaylist(playlist) {

  var title = document.getElementById('playlist-title').value;
  var desc = document.getElementById('playlist-description').value;
  var tags = document.getElementById('playlist-tags').value.split(',').map(tag => tag.trim());
  var isPublic = document.getElementById('playlist-is-public').checked;

  const data = {
    _id: playlist._id,
    title: title,
    description: desc,
    tags: tags,
    isPublic: isPublic
  };

  try {
    const response = await fetch(`${apiUrl}/modificaplaylist`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      alert("Playlist modificata con successo."); 
      window.location.reload(); 
    } else {
      throw new Error(`Errore: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Errore durante l\'aggiornamento della playlist:', error);
    alert("Si è verificato un errore durante l'aggiornamento della playlist.");
  }
}


function stampaPlaylist(playlist){
  const userJSON = sessionStorage.getItem("user");
  const user = JSON.parse(userJSON);
  const playlistItem = document.createElement('div');

  playlistItem.classList.add('item-playlist');
  playlistItem.innerHTML = `
    <h3>${playlist.title}</h3>
    <p>${playlist.description}</p>
    <p><strong>Tags:</strong> ${playlist.tags.join(', ')}</p>
    <p><strong>Numero Tracce:</strong> ${playlist.tracks.length}</p>
    <p><strong>Durata:</strong> ${formatDuration(playlist.duration)}</p>
    <p><strong>Creata da:</strong> ${playlist.creatorName}</p>
    <p><strong>Visibilità:</strong> ${playlist.isPublic ? 'Playlist Publica' : 'Playlist Privata'}</p>
    <button id="vedi-playlist" onclick="openPlaylist('${playlist._id}')">Vedi playlist</button>
  `;

  // Crea i pulsanti in base al creatore della playlist
  if (playlist.creatorName === user.username) {
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Elimina';
    deleteButton.onclick = () => deletePlaylist(playlist._id);
    playlistItem.appendChild(deleteButton);
  } else {
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copia';
    copyButton.onclick = () => copyPlaylist(playlist._id);
    playlistItem.appendChild(copyButton);
  }

  return playlistItem;
}