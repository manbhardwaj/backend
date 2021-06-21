const User = require('../models/user');
const jwt = require('jsonwebtoken');
const config = require('../config/database');

module.exports = (router) => {
    // Login Route
    router.post('/login', (req, res) => {
        // Check if username was provided
        if (!req.body.username) {
            res.json({ success: false, message: 'No username was provided' });
        } else {
            // Check if password was provided
            if (!req.body.password) {
                res.json({ success: false, message: 'No password was provided.' });
            } else {
                // Check if username exists in database
                User.findOne({ username: req.body.username.toLowerCase() }, (err, user) => {
                    // Check if error was found
                    if (err) {
                        res.json({ success: false, message: err });
                    } else {
                        // Check if username was found
                        if (!user) {
                            res.json({ success: false, message: 'Username not found.' });
                        } else {
                            const validPassword = user.comparePassword(req.body.password);
                            // Check if password is a match
                            if (!validPassword) {
                                res.json({ success: false, message: 'Password invalid' });
                            } else {
                                const token = jwt.sign({ userId: user._id }, config.secret, { expiresIn: '24h' });
                                res.json({
                                    success: true,
                                    message: 'Success!',
                                    token: token,
                                    user: {
                                        username: user.username,
                                        isAdmin: user.isAdmin
                                    }
                                });
                            }
                        }
                    }
                });
            }
        }
    });

    // Register Route
    router.post('/register', (req, res) => {
        // Check if email was provided
        if (!req.body.email) {
            res.json({ success: false, message: 'You must provide an e-mail' });
        } else {
            // Check if username was provided
            if (!req.body.username) {
                res.json({ success: false, message: 'You must provide a username' });
            } else {
                // Check if password was provided
                if (!req.body.password) {
                    res.json({ success: false, message: 'You must provide a password' });
                } else {
                    // Create new user object and apply user input
                    let user = new User({
                        email: req.body.email.toLowerCase(),
                        username: req.body.username.toLowerCase(),
                        password: req.body.password,
                        isAdmin: req.body.isAdmin
                    });
                    // Save user to database
                    user.save((err) => {
                        // Check if error occured
                        if (err) {
                            // Check if error is an error indicating duplicate account
                            if (err.code === 11000) {
                                res.json({ success: false, message: 'Username or e-mail already exists' });
                            } else {
                                if (err.errors) {
                                    // Check if validation error is in the email field
                                    if (err.errors.email) {
                                        res.json({ success: false, message: err.errors.email.message });
                                    } else {
                                        // Check if validation error is in the username field
                                        if (err.errors.username) {
                                            res.json({ success: false, message: err.errors.username.message });
                                        } else {
                                            // Check if validation error is in the password field
                                            if (err.errors.password) {
                                                res.json({ success: false, message: err.errors.password.message });
                                            } else {
                                                res.json({ success: false, message: err });
                                            }
                                        }
                                    }
                                } else {
                                    res.json({ success: false, message: 'Could not save user. Error: ', err });
                                }
                            }
                        } else {
                            res.json({ success: true, message: 'Acount registered!' });
                        }
                    });
                }
            }
        }
    });

    // Route to check if user's email is available for registration
    router.get('/checkEmail/:email', (req, res) => {
        // Check if email was provided in paramaters
        if (!req.params.email) {
            res.json({ success: false, message: 'E-mail was not provided' });
        } else {
            // Search for user's e-mail in database;
            User.findOne({ email: req.params.email }, (err, user) => {
                if (err) {
                    res.json({ success: false, message: err });
                } else {
                    // Check if user's e-mail is taken
                    if (user) {
                        res.json({ success: false, message: 'E-mail is already taken' });
                    } else {
                        res.json({ success: true, message: 'Invalid E-mail' });
                    }
                }
            });
        }
    });

    // Route to check if user's username is available for registration
    router.get('/checkUsername/:username', (req, res) => {
        // Check if username was provided in paramaters
        if (!req.params.username) {
            res.json({ success: false, message: 'Username was not provided' });
        } else {
            // Look for username in database
            User.findOne({ username: req.params.username }, (err, user) => {
                if (err) {
                    res.json({ success: false, message: err });
                } else {
                    // Check if user's username was found
                    if (user) {
                        res.json({ success: false, message: 'Username is already taken' });
                    } else {
                        res.json({ success: true, message: 'Username is available' });
                    }
                }
            });
        }
    });

    // Middleware - Grab user's token from headers
    router.use((req, res, next) => {
        const token = req.headers['authorization'];
        // Check if token was found in headers
        if (!token) {
            res.json({ success: false, message: 'No email provided' });
        } else {
            // Verify the token is valid
            jwt.verify(token, config.secret, (err, decoded) => {
                // Check if error is expired or invalid
                if (err) {
                    res.json({ success: false, message: 'Token invalid: ' + err });
                } else {
                    req.decoded = decoded; // Create global variable to use in any request beyond
                    next(); // Exit middleware
                }
            });
        }
    });

    // Route to get user's profile data
    router.get('/profile', (req, res) => {
        // Search for user in database
        User.findOne({ _id: req.decoded.userId }).select('username email').exec((err, user) => {
            // Check if error connecting
            if (err) {
                res.json({ success: false, message: err });
            } else {
                // Check if user was found in database
                if (!user) {
                    res.json({ success: false, message: 'User not found' });
                } else {
                    res.json({ success: true, user: user });
                }
            }
        });
    });

    // Route to get user's public profile data
    router.get('/publicProfile/:username', (req, res) => {
        // Check if username was passed in the parameters
        if (!req.params.username) {
            res.json({ success: false, message: 'No username was provided' });
        } else {
            // Check the database for username
            User.findOne({ username: req.params.username }).select('username email').exec((err, user) => {
                // Check if error was found
                if (err) {
                    res.json({ success: false, message: 'Something went wrong.' });
                } else {
                    // Check if user was found in the database
                    if (!user) {
                        res.json({ success: false, message: 'Username not found.' });
                    } else {
                        res.json({ success: true, user: user });
                    }
                }
            });
        }
    });

    return router;
}
