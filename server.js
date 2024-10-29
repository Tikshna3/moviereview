const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const path = require('path'); // Import path to handle file paths
const session = require('express-session'); // Import express-session for session management

const app = express();
const PORT = 3000;

// Serve static HTML files (assuming they are in the 'public' folder)
app.use(express.static(path.join(__dirname, 'registration')));



// Middleware to parse JSON and form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware
app.use(session({
    secret: 'your_secret_key', // Replace 'your_secret_key' with an actual secret key
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 } // Session expiration time (e.g., 1 minute here)
}));

// Serve static HTML files (assuming index.html is in the 'public' folder)
app.use(express.static(path.join(__dirname, 'public'))); // Set 'public' as the static folder

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/movie', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Define a schema and model
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true // Ensure the username is unique
    },
    password: {
        type: String,
        required: true
    }
});

// Define Review Schema
const reviewSchema = new mongoose.Schema({
    movie_id: String,
    user_id: String,
    username: String,
    review: String,
    created_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Review = mongoose.model('Review', reviewSchema);

// Get reviews by movie ID
app.get('/api/reviews/:movie_id', async (req, res) => {
    const reviews = await Review.find({ movie_id: req.params.movie_id });
    res.json(reviews);
});

// Add review
app.post('/api/reviews', async (req, res) => {
    const { movie_id, user_id, review } = req.body;
    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newReview = new Review({
        movie_id,
        user_id,
        username: user.username,
        review
    });
    await newReview.save();
    res.json(newReview);
});

// Delete review
app.delete('/api/reviews/:review_id', async (req, res) => {
    await Review.findByIdAndDelete(req.params.review_id);
    res.json({ message: 'Review deleted' });
});

const User = mongoose.model('registration', userSchema);

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next(); // User is authenticated, proceed to the next middleware or route
    } else {
        return res.redirect('/registration/login.html'); // Redirect to login page if not authenticated
    }
}

// Handle form submission for user registration
app.post('/register', async (req, res) => {
    try {
        // Extracting username and password from the request body
        const { username, password } = req.body;

        // Checking if username or password is missing
        if (!username || !password) {
            return res.status(400).send('Username and password are required');
        }

        // Check if the username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send('Username already taken');
        }

        // Hash the password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user instance with the hashed password
        const user = new User({ username, password: hashedPassword });

        // Save the user to the database
        await user.save();

        // Redirect to login page after successful registration
        res.status(201).redirect('/registration/login.html');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error registering user');
    }
});

// Handle form submission for user login
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).send('Username and password are required');
        }

        // Check if the user exists in the database
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).send('Invalid username or password');
        }

        // Compare the password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid username or password');
        }

        // Set session data
        req.session.user = user.username;

        // Redirect to index.html if login is successful
        res.status(200).redirect('/index.html');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error logging in user');
    }
});

// Logout route to clear the session
app.get('/logout', (req, res) => {
    // Destroy the session and redirect to the login page
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }

        // Setting headers to prevent caching of protected pages
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Expires', '-1'); // Ensuring the page is expired
        res.status(302).redirect('/registration/login.html'); // Redirect to login page with 302 status code
    });
});


// Protected route for index.html using isAuthenticated middleware
app.get('/index.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Serve index.html if authenticated
});

// Middleware to disable caching for all requests
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

async function addReview(movie_id, reviewText) {
    const user_id = localStorage.getItem('user_id'); // assuming user_id is saved in local storage after login
    const resp = await fetch(`/api/reviews`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ movie_id, user_id, review: reviewText })
    });
    const newReview = await resp.json();
    fetchReviews(movie_id); // Refresh reviews
}

// Event listener for the review submission
document.querySelector('.add-review-button').addEventListener('click', () => {
    const movie_id = /* get movie ID from context */;
    const reviewText = document.querySelector('.review-input').value;
    addReview(movie_id, reviewText);
});

async function deleteReview(review_id) {
    await fetch(`/api/reviews/${review_id}`, {
        method: 'DELETE'
    });
    const movie_id = /* get movie ID from context */;
    fetchReviews(movie_id); // Refresh reviews
}

