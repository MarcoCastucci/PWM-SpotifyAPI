const MongoClient = require('mongodb').MongoClient; // Import MongoClient
const ObjectId = require('mongodb').ObjectId;
const express = require('express');
const cors = require("cors");
const morgan = require("morgan");
const app = express();
const path = require('path');


// MongoDB stringa
const mongoURI = 'mongodb+srv://MarcoCastucci:MarcoPWM@pwm-db.s65em.mongodb.net/?retryWrites=true&w=majority&appName=pwm-db';

//server
app.use(cors());
app.use(morgan("tiny"));
app.use(express.json());

const port = 3000;

app.listen(port, () => {
  console.log(`Server avviato su http://localhost:${port}`);
});

app.use(express.static(path.join(__dirname)));

// GET "/" endopint
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "login.html"));
});


// POST /register endpoint
async function newUser(res, user) {
  //console.log(user);
  try {
    // Connessione a MongoDB
    const client = await MongoClient.connect(mongoURI);
    const db = client.db("pwm-db");
    const usersCollection = db.collection('users');

    // Controlla se esiste un utente con la stessa mail
    const existingUser = await usersCollection.findOne({ email: user.email });
    if (existingUser) {
      return res.status(400).json({ message: 'Questa Email è già collegata ad un account esistente.' });
    }

    const existingUsername = await usersCollection.findOne({ username: user.username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username già utilizzato.' });
    }

    // Se il contrllo ^ è negativo allora salva il nuovo user
    const result = await usersCollection.insertOne(user);
    res.status(201).json({ message: 'Registazione eseguita con successo', data: result });
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /login endpoint
async function checkUser(res, user) {
  //console.log(user);
  try {
    // Connessione a MongoDB
    const client = await MongoClient.connect(mongoURI);
    const db = client.db("pwm-db");
    const usersCollection = db.collection('users');

    // Controlla se esiste un utente con la stessa mail
    const log = await usersCollection.findOne({ email: user.email, password: user.password });

    if (log == null) {
      res.status(401).send("Email o Password sbagliate.");
    } else {
      // Move project outside of findOne
      delete log.password; // Remove password from the result
      res.json(log);
    }
  }catch (error) {
    console.error('Server Error:', error);
    res.status(500).send('Internal server error' );
  }
};

// DELETE /delete/ endpoint
async function CancUser(res, user) {

  const userid = new ObjectId(user._id);

  if (user == undefined) {
    res.status(400).send("Missing user id")
    return
  }

  try {

    // Connessione a MongoDB
    const client = await MongoClient.connect(mongoURI);
    const db = client.db("pwm-db");
    const usersCollection = db.collection('users');

    const result = await usersCollection.deleteOne({ _id: userid});
    if (result.deletedCount === 1) {
      res.status(200).send({ message: 'Cancellazione eseguita con successo', data: result });
    } else {
      res.status(404).send({ message: 'Utente non trovato' });
    }
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

// PUT /modificauser/ endpoint
async function modUser(res, user) {
  //console.log(user);
  try {
    // Connessione a MongoDB
    const client = await MongoClient.connect(mongoURI);
    const db = client.db("pwm-db");
    const usersCollection = db.collection('users');


    const userId = new ObjectId(user._id);
    const existingUser = await usersCollection.findOne({ _id: userId });

    if (!existingUser) {
      console.log('Utente da modificare inesistente');
      res.status(400).send('Utente da modificare inesistente');
      return;
    }


    const usernameConflict = await usersCollection.findOne({
      username: user.username,
      _id: { $ne: userId } 
    });

    if (usernameConflict) {
      console.log('Nome utente già esistente');
      res.status(400).send('Nome utente già esistente');
      return; 
    }


    const emailConflict = await usersCollection.findOne({
      email: user.email,
      _id: { $ne: userId } 
    });

    if (emailConflict) {
      console.log('Email già esistente');
      res.status(400).send('Email già esistente');
      return; 
    }

    var updateFields = {
      $set: {
        username: user.username,
        email: user.email,
        artists: user.artists,
        genere: user.genere
      }
    };

    if (user.password) {
      updateFields.$set['password'] = user.password;
    }


    const result = await usersCollection.updateOne({ _id: userId }, updateFields);

    if (result.modifiedCount === 1) {
      console.log("Aggiornamento eseguito con successo");
      res.status(200).send({ message: 'Aggiornamento eseguito con successo' });
    } else {
      console.log('Nessun cambiamento effettuato o utente non trovato');
      res.status(400).send('Nessun cambiamento effettuato o utente non trovato');
    }
  } catch (e) {
    console.log('Errore durante la modifica dell\'utente:', e);
    if (e.code === 11000) { // Gestione del codice di errore MongoDB 11000
      console.log("Utente già presente");
      res.status(400).send("Utente già presente");
    } else {
      console.log("Errore generico");
      res.status(500).send(`Errore generico: ${e}`);
    }
  }
}


// POST /register endpoint
app.post("/register", async (req, res) => {
  await newUser(res, req.body);
});

// POST /login endpoint
app.post("/login", async (req, res) => {
  await checkUser(res, req.body);
});

// DELETE /delete/ endpoint
app.delete("/delete/", async (req, res) => {
  await CancUser(res, req.body);
});

// PUT /modificauser/ endpoint
app.put("/modificauser/", async (req, res) => {
  await modUser(res, req.body);
});

// GET /profile/:id endpoint + function
app.get("/profile/:id", async (req, res) => {
  // Connessione a MongoDB
  const client = await MongoClient.connect(mongoURI);
  const db = client.db("pwm-db");
  const usersCollection = db.collection('users');
  
  const userId = new ObjectId(req.params.id);
  
  const data = await usersCollection.findOne(
    { _id: userId },
    { projection: { artists: 1, genere: 1, _id: 0 } } 
  );
    
  if (!data) {
    return res.status(404).send({ message: 'Utente non trovato' });
  }

  //console.log('Dati utente restituiti:', data); //debug
  res.json(data);
});


// POST /createplaylist endpoint
async function createPlaylist(res, playlist) {
  //console.log(playlist);
  try {
    // Connessione a MongoDB
    const client = await MongoClient.connect(mongoURI);
    const db = client.db("pwm-db");
    const playlistsCollection = db.collection('playlists');

    const duration = playlist.duration || 0;
    const numtracks = playlist.numberOfTracks || 0;

    const result = await playlistsCollection.insertOne({
      title: playlist.title,
      userId: playlist.userId,
      creatorName: playlist.creatorName,
      description: playlist.description,
      numberOfTracks: numtracks,
      duration: duration,
      tracks: playlist.tracks || [],
      tags: playlist.tags || [],
      isPublic: playlist.isPublic || false 
    });

    res.status(201).json({ message: 'Playlist creata con successo', data: result });
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /playlists/:userId endpoint
async function getuserPlaylists(res, userId) {
  //console.log(userId);
  try {
    // Connessione a MongoDB
    const client = await MongoClient.connect(mongoURI);
    const db = client.db("pwm-db");
    const playlistsCollection = db.collection('playlists');

    // Recupera solo le playlist pubbliche o quelle create dall'utente
    const playlists = await playlistsCollection.find({ $or: [{ userId: userId }] }).toArray();
    res.status(200).json(playlists);
    
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// DELETE /playlist/:id/:userId endpoint
async function deletePlaylist(res, playlistId, userId) {
  try {
    // Connessione a MongoDB
    const client = await MongoClient.connect(mongoURI);
    const db = client.db("pwm-db");
    const playlistsCollection = db.collection('playlists');

    // Verifica se l'utente è il creatore della playlist o se è un amministratore
    const playlist = await playlistsCollection.findOne({ _id: new ObjectId(playlistId) });
    if (!playlist || (playlist.userId !== userId)) {
      return res.status(403).json({ message: 'Non hai i permessi per eliminare questa playlist' });
    }

    const result = await playlistsCollection.deleteOne({ _id: new ObjectId(playlistId) });
    if (result.deletedCount === 1) {
      res.status(200).json({ message: 'Playlist eliminata con successo' });
    } else {
      res.status(404).json({ message: 'Playlist non trovata' });
    }
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /createplaylist endpoint
app.post("/createplaylist", async (req, res) => {
  await createPlaylist(res, req.body);
});

// GET /playlists/:userId endpoint
app.get("/playlists/:userId", async (req, res) => {
  await getuserPlaylists(res, req.params.userId);
});

// DELETE /playlist/:id/:userId endpoint
app.delete("/playlist/:id/:userId", async (req, res) => {
  await deletePlaylist(res, req.params.id, req.params.userId);
});



// POST /playlist/:playlistId/track endpoint
async function addTrackToPlaylist(res, playlistId, track, trackDuration) {
  try {
    // Connessione a MongoDB
    const client = await MongoClient.connect(mongoURI);
    const db = client.db("pwm-db");
    const playlistsCollection = db.collection('playlists');

    const playlist = await playlistsCollection.findOne(
      { _id: new ObjectId(playlistId), 'tracks': track }
    );

    if(playlist)
    {
      console.log("Canzone già presente.");
      res.status(400).json({ message: 'Track already exists in the playlist.' });
      return;
    }

    const result = await playlistsCollection.updateOne(
      { _id: new ObjectId(playlistId) },
      {
        $addToSet: { tracks: track },
        $inc: { numberOfTracks: +1, duration: +trackDuration }
      }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: 'Track added successfully' });
    } else {
      res.status(404).json({ message: 'Playlist not found' });
    }
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}



// DELETE /playlist/:playlistId/track/:trackId
async function removeTrackFromPlaylist(res, playlistId, trackId, trackDuration) {
  try {
    // Connessione a MongoDB
    const client = await MongoClient.connect(mongoURI);
    const db = client.db("pwm-db");
    const playlistsCollection = db.collection('playlists');

    const playlist = await playlistsCollection.findOne({ _id: new ObjectId(playlistId) });

    if (!playlist) {
      //console.log(playlist);
      return res.status(404).json({ message: 'Playlist not found' });
    }

    const track = playlist.tracks.find(t => t === trackId);
    if (!track) {
      return res.status(404).json({ message: 'Track not found in playlist' });
    }
    
    const result = await playlistsCollection.updateOne(
      { _id: new ObjectId(playlistId) },
      {
        $pull: { tracks: trackId },
        $inc: { numberOfTracks: -1, duration: -trackDuration }
      }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: 'Track removed successfully' });
    } else {
      res.status(404).json({ message: 'Playlist or track not found' });
    }
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /playlist/:playlistId/track/:trackId/:trackDuration endpoint
app.post("/playlist/:playlistId/track/:trackId/:trackDuration", async (req, res) => {
  await addTrackToPlaylist(res, req.params.playlistId, req.params.trackId, req.params.trackDuration);
});

// DELETE /playlist/:playlistId/track/:trackId/:trackDuration
app.delete("/playlist/:playlistId/track/:trackId/:trackDuration", async (req, res) => {
  await removeTrackFromPlaylist(res, req.params.playlistId, req.params.trackId, req.params.trackDuration);
});


// GET /playlists/public/:userId endpoint
async function getPublicPlaylists(res, userId) {
  try {
    // Connessione a MongoDB
    const client = await MongoClient.connect(mongoURI);
    const db = client.db("pwm-db");
    const playlistsCollection = db.collection('playlists');

    // Recupera tutte le playlist con isPublic: true
    const publicPlaylists = await playlistsCollection.find({ $and: [{ isPublic: true }, { userId: { $ne: userId }}] }).toArray();
    res.status(200).json(publicPlaylists);
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /playlists/public/:userId endpoint
app.get("/playlists/public/:userId", async (req, res) => {
  await getPublicPlaylists(res, req.params.userId);
});


// GET /playlist/:id endpoint
async function getAPlaylists(res, playlistId){
  try {
    // Connessione a MongoDB
    const client = await MongoClient.connect(mongoURI);
    const db = client.db("pwm-db");
    const playlistsCollection = db.collection('playlists');

    const playlist = await playlistsCollection.findOne({ _id: new ObjectId(playlistId) });
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found or is not public' });
    }

    console.log(playlist);
    res.status(200).json(playlist);
    
} catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ message: 'Internal server error' });
}
}

// GET /playlist/:id endpoint
app.get('/playlist/:id', async (req, res) => {
  await getAPlaylists(res, req.params.id);
});


// POST /playlist/:userId endpoint
async function troPlaylistTagsTrack(res, UserId, body) {

  tag = body.tags;
  trackId = body.trackId;
  /*
  console.log(tag);
  console.log(typeof tag);
  console.log(trackId);
  console.log(typeof trackId);
  */
  try {
    if (trackId === undefined && tag  === ""){
      return res.status(400).json({ message: 'Invalid request' });
    }
    // Connessione a MongoDB
    const client = await MongoClient.connect(mongoURI);
    const db = client.db("pwm-db");
    const playlistsCollection = db.collection('playlists');
    
    let playlist = [];
    
    /*sia tag che trackid sono stati passsati e sono validi*/
   if (trackId !== undefined && tag  !== "") {

    // Recupera tutte le playlist con isPublic: true e che hanno nell'array tracks il trackId e che hanno nell'array tags il tag e userId non è UserId
    const playlistpubTT = await playlistsCollection.find({ tags: { $in: [tag] }, isPublic: true, tracks: { $in: [trackId] }, userId: { $ne: UserId } }).toArray();
    console.log(playlistpubTT);
    // Recupera tutte le playlist che hanno nell'array tracks il trackId e che hanno nell'array tags il tag e userId è UserId
    const playlistTT = await playlistsCollection.find({ tags: { $in: [tag] }, tracks: { $in: [trackId] }, userId: UserId }).toArray();
    console.log(playlistTT);
    // Uniscono i risultati in playlist
    playlist = [...playlistTT, ...playlistpubTT];
  }
  
  /*solo tag è stato passsato ed è valido*/
  if (trackId === undefined && tag  !== "") {
    // Recupera tutte le playlist con isPublic: true e che hanno nell'array tags il tag e userId non è UserId
    const playlistpubTag = await playlistsCollection.find({ tags: { $in: [tag] }, isPublic: true, userId: { $ne: UserId } }).toArray();
    console.log(playlistpubTag);
    // Recupera tutte le playlist che hanno nell'array tags il tag e userId è UserId
    const playlistTag = await playlistsCollection.find({ tags: { $in: [tag] }, userId: UserId }).toArray();
    console.log(playlistTag);
    // Uniscono i risultati in playlist
    playlist = [...playlistTag, ...playlistpubTag];
  }
  
  /*solo trackId è stato passsato ed è valido*/
  if (trackId !== undefined && tag  === "") {
    // Recupera tutte le playlist con isPublic: true e che hanno nell'array tracks il trackId e userId non è UserId
    const playlistpubTrack = await playlistsCollection.find({ isPublic: true, tracks: { $in: [trackId] }, userId: { $ne: UserId } }).toArray();
    console.log(playlistpubTrack);
    // Recupera tutte le playlist che hanno nell'array tracks il trackId e userId è UserId
    const playlistTrack = await playlistsCollection.find({ tracks: { $in: [trackId] }, userId: UserId }).toArray();
    console.log(playlistTrack);
    // Uniscono i risultati in playlist
    playlist = [...playlistTrack, ...playlistpubTrack];
  }

  if (playlist.length === 0) {
    console.log(playlist);
    return res.status(404).json({ message: 'Playlist not found' });
  }

    console.log("Found playlists:", playlist);
    res.status(200).json(playlist);
    
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// POST /playlist/:userId endpoint
app.post('/playlist/:userId', async (req, res) => {
  await troPlaylistTagsTrack(res, req.params.userId, req.body);
});


// GET /playlists/:title/:userId endpoint
async function checkPlaylisteTitle(res, title, userId) {
  try {
    // Connessione a MongoDB
    const client = await MongoClient.connect(mongoURI);
    const db = client.db("pwm-db");
    const playlistsCollection = db.collection('playlists');

    // Recupera solo le playlist pubbliche o quelle create dall'utente
    const playlists = await playlistsCollection.find({ $and: [{ userId: userId }, { title: title }] }).toArray();
    
    const exists = playlists.length > 0;

    res.status(200).json({ exists });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /playlists/:title/:userId endpoint
app.get("/playlists/:title/:userId", async (req, res) => {
  await checkPlaylisteTitle(res, req.params.title, req.params.userId);
});


// PUT /modificaplaylist endpoint - Funzione per aggiornare la playlist nel database
async function updatePlaylist(res, playlistData) {
  try {
    // Connessione a MongoDB
    const client = await MongoClient.connect(mongoURI);
    const db = client.db("pwm-db");
    const playlistsCollection = db.collection('playlists');

    const filter = { _id: new ObjectId(playlistData._id) };

    const update = {
      $set: {
        title: playlistData.title,
        description: playlistData.description,
        tags: playlistData.tags,
        isPublic: playlistData.isPublic
      }
    };

    const result = await playlistsCollection.updateOne(filter, update);

    if (result.matchedCount === 0) {
      res.status(404).json({ message: 'Playlist not found' });
    } else if (result.modifiedCount > 0) {
      res.status(200).json({ message: 'Playlist updated successfully' });
    } else {
      res.status(200).json({ message: 'No changes were made to the playlist' });
    }
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// PUT /modificaplaylist endpoint
app.put("/modificaplaylist", async (req, res) => {
  await updatePlaylist(res, req.body);
});
