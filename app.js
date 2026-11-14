const express = require('express'); // Import Express
const session = require('express-session'); // Import Express-Session
const bodyParser = require('body-parser'); // Import Body-Parser
const path = require('path'); // Path module for file paths

const app = express(); // Initialize Express

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Set up sessions
app.use(
  session({
    secret: 'secret-key', // Replace with a stronger secret key
    resave: false,
    saveUninitialized: true,
  })
);

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Serve static files (e.g., images, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Home Route
app.get('/', (req, res) => {
  res.render('home'); // Render the home.ejs file
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const { MongoClient } = require('mongodb'); // Import MongoDB client

// MongoDB connection URI
const uri = 'mongodb://127.0.0.1:27017'; // Localhost default URI
const client = new MongoClient(uri); // Create a new MongoDB client

// Connect to MongoDB
let db;
client.connect()
  .then(() => {
    console.log('Connected to MongoDB');
    db = client.db('myDB'); // Use the 'myDB' database
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
  });

  const usersCollection = () => db.collection('myCollection'); // Users collection
const destinationsCollection = () => db.collection('destinations'); // Destinations collection

app.get('/test-db', async (req, res) => {
  try {
    const users = await usersCollection().find({}).toArray(); // Fetch all users
    res.send(users); // Display users in the browser
  } catch (error) {
    res.status(500).send('Error connecting to database');
  }
});


app.get('/registeration', (req, res) => {
  res.render('registration');
});


app.post('/registeration', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await usersCollection().findOne({ username });

    if (existingUser) {
      return res.send('User already exists. Please log in.');
    }

    // Insert the new user into the database
    await usersCollection().insertOne({
      username,
      password, // Note: Always hash passwords in production
      wantToGoList: [] // Initialize an empty Want-to-Go List
    });

    // Redirect to the login page with the success query parameter
    res.redirect('/login?success=1');
    console.log('Redirecting to /login?success=1');

  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).send('Error during registration');
  }
});



app.get('/login', (req, res) => {
  const successMessage = req.query.success ? 'Registration was successful' : null;
  res.render('login', { successMessage });
  console.log('Success Message:', successMessage);
});



app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the user in the database
    const user = await usersCollection().findOne({ username });

    // If user doesn't exist or password doesn't match
    if (!user || user.password !== password) {
      return res.send('Invalid username or password!');
    }

    // If login is successful, save the user in the session
    req.session.user = user;
    res.redirect('/'); // Redirect to the home page
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Error during login');
  }
});

const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    // User is logged in, proceed
    return next();
  }
  // Redirect to login if not authenticated
  res.redirect('/login');
};


app.get('/', isAuthenticated, (req, res) => {
  res.render('home', { user: req.session.user });
});




app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login'); // Redirect to login after logging out
  });
});

app.get('/', isAuthenticated, (req, res) => {
  res.render('home', { user: req.session.user });
});


app.get('/hiking', isAuthenticated, (req, res) => {
  res.render('hiking'); // Render hiking.ejs
});

app.get('/cities', isAuthenticated, (req, res) => {
  res.render('cities'); // Render cities.ejs
});

app.get('/islands', isAuthenticated, (req, res) => {
  res.render('islands'); // Render islands.ejs
});

app.get('/wanttogo', isAuthenticated, async (req, res) => {
  try {
    const username = req.session.user.username; // Logged-in user's username
    const user = await usersCollection().findOne({ username }); // Fetch user details
    const destinations = user.wantToGoList || []; // Get Want-to-Go List
    const status = req.query.status || ''; // Get status from query parameters (default to '')

    // Pass `destinations` and `status` to the EJS template
    res.render('wanttogo', { destinations, status });
  } catch (error) {
    console.error('Error retrieving Want-to-Go List:', error);
    res.status(500).send('Error retrieving Want-to-Go List');
  }
});


app.post('/search', isAuthenticated, async (req, res) => {
  const searchKey = req.body.Search.toLowerCase();

  try {
    const results = await destinationsCollection()
      .find({ name: { $regex: searchKey, $options: 'i' } }) // Case-insensitive search
      .toArray();

    if (results.length === 0) {
      return res.send('No destinations found!');
    }

    res.render('searchresults', { results }); // Pass results to the view
  } catch (error) {
    console.error('Error during search:', error);
    res.status(500).send('Error during search');
  }
});


app.post('/search', isAuthenticated, async (req, res) => {
  const searchKey = req.body.Search.toLowerCase();

  try {
    // Perform a case-insensitive search on destination names
    const results = await destinationsCollection()
      .find({ name: { $regex: searchKey, $options: 'i' } }) // Regex search
      .toArray();

    res.render('searchresults', { results }); // Pass results to the searchresults.ejs
  } catch (error) {
    console.error('Error during search:', error);
    res.status(500).send('Error during search');
  }
});


app.get('/paris', isAuthenticated, (req, res) => {
  res.render('paris');
});

app.get('/rome', isAuthenticated, (req, res) => {
  res.render('rome');
});

app.get('/santorini', isAuthenticated, (req, res) => {
  res.render('santorini');
});

app.get('/inca', isAuthenticated, (req, res) => {
  res.render('inca');
});

app.get('/annapurna', isAuthenticated, (req, res) => {
  res.render('annapurna');
});

app.get('/bali', isAuthenticated, (req, res) => {
  res.render('bali');
});


app.post('/wanttogo', isAuthenticated, async (req, res) => {
  const destinationName = req.body.destinationName; // Get destination name from form
  const username = req.session.user.username; // Logged-in user's username

  try {
    // Find the user in the database
    const user = await usersCollection().findOne({ username });

    // Check if the destination already exists in the user's Want-to-Go list
    const alreadyExists = user.wantToGoList.some(
      (destination) => destination.name === destinationName
    );

    if (!alreadyExists) {
      // Fetch destination details from the Destinations collection
      const destination = await destinationsCollection().findOne({ name: destinationName });

      if (destination) {
        // Add destination to the user's Want-to-Go List
        await usersCollection().updateOne(
          { username },
          {
            $push: {
              wantToGoList: {
                name: destination.name,
                description: destination.description,
              },
            },
          }
        );
      }
    }

    // Redirect with appropriate status
    res.redirect(`/wanttogo?status=${alreadyExists ? 'exists' : 'added'}`);
  } catch (error) {
    console.error('Error adding to Want-to-Go List:', error);
    res.status(500).send('Error adding to Want-to-Go List');
  }
});




// Route for rendering the registration page
app.get('/registration', (req, res) => {
  res.render('registration');
});



app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await usersCollection().findOne({ username });

    if (existingUser) {
      return res.send('User already exists. Please log in.');
    }

    // Insert the new user into the database
    await usersCollection().insertOne({
      username,
      password, // Note: Always hash passwords in production
      wantToGoList: [] // Initialize an empty Want-to-Go List
    });

    // Redirect to the login page with the success query parameter
    res.redirect('/login?success=1');
    console.log('Redirecting to /login?success=1');

  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).send('Error during registration');
  }
});

