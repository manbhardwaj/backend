const env = require('./env');

const express = require('express');
// Initialize express
const app = express();
const router = express.Router();

const mongoose = require('mongoose');
const config = require('./config/database');
const path = require('path');
const authentication = require('./routes/authentication')(router);
const blogs = require('./routes/blogs')(router);
const bodyParser = require('body-parser');
const cors = require('cors');
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;

// Initialize mongoose
mongoose.Promise = global.Promise;
mongoose.connect(config.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, (err) => {
    // Check if database was able to connect
    if (err) {
        console.log('Could NOT connect to database: ', err); // Return error message
    } else {
        console.log('Connected to ' + config.db); // Return success message
    }
});

// Middleware
// app.use(cors({ origin: 'http://localhost:4200' })); // Allows cross origin in development only
app.use(express.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(express.json()); // parse application/json
app.use(express.static(__dirname + '/public')); // Provide static directory for frontend
app.use('/authentication', authentication); // Use Authentication routes in application
app.use('/blogs', blogs); // Use Blog routes in application

// Connect server to Angular 2 Index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

// Start Server: Listen on port 8080
app.listen(port, () => {
    console.log('Listening on port ' + port + ' in ' + process.env.NODE_ENV + ' mode');
});