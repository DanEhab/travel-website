const express = require('express'); // Import Express
const session = require('express-session'); // Import Express-Session
const bodyParser = require('body-parser'); // Import Body-Parser
const path = require('path'); // Path module for file paths
const { MongoClient } = require('mongodb'); // Import MongoDB client

const app = express(); // Initialize Express

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Set up sessions (each logged-in user gets their own session)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret-key',
    resave: false,
    saveUninitialized: false,
  })
);

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Serve static files (images) and Bootstrap from node_modules
app.use(express.static(path.join(__dirname, 'public')));
app.use('/vendor/bootstrap', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));

// MongoDB connection
const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017'; // Localhost default URI
const client = new MongoClient(uri);
let db;

const usersCollection = () => db.collection('myCollection'); // Users collection
const destinationsCollection = () => db.collection('destinations'); // Destinations collection

// Only logged-in users can see the rest of the website
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login');
};

// ---------------------------------------------------------------- Login & registration

app.get('/login', (req, res) => {
  const successMessage = req.query.success ? 'Registration was successful' : null;
  res.render('login', { successMessage, errorMessage: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await usersCollection().findOne({ username });

    // If user doesn't exist or password doesn't match
    if (!user || user.password !== password) {
      return res.render('login', { successMessage: null, errorMessage: 'Invalid username or password!' });
    }

    // Save only what we need in the session
    req.session.user = { username: user.username };
    res.redirect('/');
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Error during login');
  }
});

app.get('/registration', (req, res) => {
  res.render('registration', { errorMessage: null });
});

app.post('/register', async (req, res) => {
  const username = (req.body.username || '').trim();
  const password = req.body.password || '';

  // Both fields are required
  if (!username || !password) {
    return res.render('registration', { errorMessage: 'Please fill in both the username and the password.' });
  }

  try {
    // Check if the user already exists
    const existingUser = await usersCollection().findOne({ username });
    if (existingUser) {
      return res.render('registration', { errorMessage: 'This username is already taken.' });
    }

    // Insert the new user into the database
    await usersCollection().insertOne({
      username,
      password, // Stored as plain text, as in the course project
      wantToGoList: [], // Initialize an empty Want-to-Go List
    });

    // Redirect to the login page with the success query parameter
    res.redirect('/login?success=1');
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).send('Error during registration');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login'); // Redirect to login after logging out
  });
});

// ---------------------------------------------------------------- Pages

app.get('/', isAuthenticated, (req, res) => {
  res.render('home', { user: req.session.user });
});

// Category pages
for (const page of ['hiking', 'cities', 'islands']) {
  app.get(`/${page}`, isAuthenticated, (req, res) => res.render(page));
}

// Destination pages
for (const page of ['paris', 'rome', 'santorini', 'bali', 'inca', 'annapurna']) {
  app.get(`/${page}`, isAuthenticated, (req, res) => res.render(page));
}

// ---------------------------------------------------------------- Want-to-Go list

app.get('/wanttogo', isAuthenticated, async (req, res) => {
  try {
    const user = await usersCollection().findOne({ username: req.session.user.username });
    const destinations = (user && user.wantToGoList) || [];
    const status = req.query.status || '';
    res.render('wanttogo', { destinations, status });
  } catch (error) {
    console.error('Error retrieving Want-to-Go List:', error);
    res.status(500).send('Error retrieving Want-to-Go List');
  }
});

app.post('/wanttogo', isAuthenticated, async (req, res) => {
  const destinationName = req.body.destinationName;
  const username = req.session.user.username;

  try {
    const user = await usersCollection().findOne({ username });

    // Check if the destination already exists in the user's Want-to-Go list
    const alreadyExists = user.wantToGoList.some((destination) => destination.name === destinationName);

    if (!alreadyExists) {
      // Fetch destination details from the Destinations collection
      const destination = await destinationsCollection().findOne({ name: destinationName });

      if (destination) {
        await usersCollection().updateOne(
          { username },
          { $push: { wantToGoList: { name: destination.name, description: destination.description } } }
        );
      }
    }

    res.redirect(`/wanttogo?status=${alreadyExists ? 'exists' : 'added'}`);
  } catch (error) {
    console.error('Error adding to Want-to-Go List:', error);
    res.status(500).send('Error adding to Want-to-Go List');
  }
});

// ---------------------------------------------------------------- Search

// Escape characters that have a special meaning in regular expressions
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

app.post('/search', isAuthenticated, async (req, res) => {
  const searchKey = (req.body.Search || '').trim();

  try {
    // Case-insensitive search on destination names (e.g. "div" finds "Maldives")
    const results = searchKey
      ? await destinationsCollection().find({ name: { $regex: escapeRegex(searchKey), $options: 'i' } }).toArray()
      : [];

    res.render('searchresults', { results });
  } catch (error) {
    console.error('Error during search:', error);
    res.status(500).send('Error during search');
  }
});

// ---------------------------------------------------------------- Start

const PORT = process.env.PORT || 3000;

client
  .connect()
  .then(() => {
    console.log('Connected to MongoDB');
    db = client.db(process.env.DB_NAME || 'myDB');
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
