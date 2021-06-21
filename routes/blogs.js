const User = require('../models/user'); // Import User Model Schema
const Blog = require('../models/blog'); // Import Blog Model Schema
const jwt = require('jsonwebtoken'); // Compact, URL-safe means of representing claims to be transferred between two parties.
const config = require('../config/database'); // Import database configuration

module.exports = (router) => {

    // Create new blog
    router.post('/newBlog', (req, res) => {
        // Check if blog title was provided
        if (!req.body.title) {
            res.json({ success: false, message: 'Blog title is required.' });
        } else {
            // Check if blog body was provided
            if (!req.body.body) {
                res.json({ success: false, message: 'Blog body is required.' });
            } else {
                // Check if blog's creator was provided
                if (!req.body.createdBy) {
                    res.json({ success: false, message: 'Blog creator is required.' });
                } else {
                    // Create the blog object for insertion into database
                    const blog = new Blog({
                        title: req.body.title,
                        body: req.body.body,
                        createdBy: req.body.createdBy,
                        isApproved: req.body.isApproved,
                    });
                    // Save blog into database
                    blog.save((err) => {
                        // Check if error
                        if (err) {
                            // Check if error is a validation error
                            if (err.errors) {
                                // Check if validation error is in the title field
                                if (err.errors.title) {
                                    res.json({ success: false, message: err.errors.title.message });
                                } else {
                                    // Check if validation error is in the body field
                                    if (err.errors.body) {
                                        res.json({ success: false, message: err.errors.body.message });
                                    } else {
                                        res.json({ success: false, message: err });
                                    }
                                }
                            } else {
                                res.json({ success: false, message: err });
                            }
                        } else {
                            res.json({ success: true, message: 'Blog saved!' });
                        }
                    });
                }
            }
        }
    });

    // Get all blogs
    router.get('/allBlogs', (req, res) => {
        // Search database for all blog posts
        Blog.find({ isApproved: true }, (err, blogs) => {
            // Check if error was found or not
            if (err) {
                res.json({ success: false, message: err });
            } else {
                // Check if blogs were found in database
                if (!blogs) {
                    res.json({ success: false, message: 'No blogs found.' });
                } else {
                    res.json({ success: true, blogs: blogs });
                }
            }
        }).sort({ '_id': -1 }); // Sort blogs from newest to oldest
    });

    // Get all blogs admin
    router.get('/admin/allBlogs', (req, res) => {
        User.findOne({ _id: req.decoded.userId }, (err, user) => {
            // Check if error was found
            if (err) {
                res.json({ success: false, message: err });
            } else {
                // Check if user was found in the database
                if (!user) {
                    res.json({ success: false, message: 'Unable to authenticate user.' });
                } else {
                    // Check if user logged in the the one requesting to update blog post
                    if (!user.isAdmin) {
                        res.json({ success: false, message: 'You are not authorized to get all blogs.' });
                    } else {
                        // Search database for all blog posts
                        Blog.find({}, (err, blogs) => {
                            // Check if error was found or not
                            if (err) {
                                res.json({ success: false, message: err });
                            } else {
                                // Check if blogs were found in database
                                if (!blogs) {
                                    res.json({ success: false, message: 'No blogs found.' });
                                } else {
                                    res.json({ success: true, blogs: blogs });
                                }
                            }
                        }).sort({ '_id': -1 }); // Sort blogs from newest to oldest
                    }
                }
            }
        });
    });

    // Get blog by id
    router.get('/singleBlog/:id', (req, res) => {
        // Check if id is present in parameters
        if (!req.params.id) {
            res.json({ success: false, message: 'No blog ID was provided.' });
        } else {
            // Check if the blog id is found in database
            Blog.findOne({ _id: req.params.id }, (err, blog) => {
                // Check if the id is a valid ID
                if (err) {
                    res.json({ success: false, message: 'Not a valid blog id' });
                } else {
                    // Check if blog was found by id
                    if (!blog) {
                        res.json({ success: false, message: 'Blog not found.' });
                    } else {
                        // Find the current user that is logged in
                        User.findOne({ _id: req.decoded.userId }, (err, user) => {
                            // Check if error was found
                            if (err) {
                                res.json({ success: false, message: err });
                            } else {
                                // Check if username was found in database
                                if (!user) {
                                    res.json({ success: false, message: 'Unable to authenticate user' });
                                } else {
                                    // Check if the user who requested single blog is the one who created it
                                    if (user.username !== blog.createdBy) {
                                        res.json({ success: false, message: 'You are not authorized to edit this blog.' });
                                    } else {
                                        res.json({ success: true, blog: blog });
                                    }
                                }
                            }
                        });
                    }
                }
            });
        }
    });

    // Update blog
    router.put('/updateBlog', (req, res) => {
        // Check if id was provided
        if (!req.body._id) {
            res.json({ success: false, message: 'No blog id provided' });
        } else {
            // Check if id exists in database
            Blog.findOne({ _id: req.body._id }, (err, blog) => {
                // Check if id is a valid ID
                if (err) {
                    res.json({ success: false, message: 'Not a valid blog id' });
                } else {
                    // Check if id was found in the database
                    if (!blog) {
                        res.json({ success: false, message: 'Blog id was not found.' });
                    } else {
                        // Check who user is that is requesting blog update
                        User.findOne({ _id: req.decoded.userId }, (err, user) => {
                            // Check if error was found
                            if (err) {
                                res.json({ success: false, message: err });
                            } else {
                                // Check if user was found in the database
                                if (!user) {
                                    res.json({ success: false, message: 'Unable to authenticate user.' });
                                } else {
                                    // Check if user logged in the the one requesting to update blog post
                                    if (user.username !== blog.createdBy) {
                                        res.json({ success: false, message: 'You are not authorized to edit this blog post.' });
                                    } else {
                                        blog.title = req.body.title;
                                        blog.body = req.body.body;
                                        blog.save((err) => {
                                            if (err) {
                                                if (err.errors) {
                                                    res.json({ success: false, message: 'Please ensure form is filled out properly' });
                                                } else {
                                                    res.json({ success: false, message: err });
                                                }
                                            } else {
                                                res.json({ success: true, message: 'Blog Updated!' });
                                            }
                                        });
                                    }
                                }
                            }
                        });
                    }
                }
            });
        }
    });

    // Approve blog
    router.put('/approveBlog', (req, res) => {
        // Check if id was provided
        if (!req.body._id) {
            res.json({ success: false, message: 'No blog id provided' });
        } else {
            // Check if id exists in database
            Blog.findOne({ _id: req.body._id }, (err, blog) => {
                // Check if id is a valid ID
                if (err) {
                    res.json({ success: false, message: 'Not a valid blog id' });
                } else {
                    // Check if id was found in the database
                    if (!blog) {
                        res.json({ success: false, message: 'Blog id was not found.' });
                    } else {
                        // Check who user is that is requesting blog update
                        User.findOne({ _id: req.decoded.userId }, (err, user) => {
                            // Check if error was found
                            if (err) {
                                res.json({ success: false, message: err });
                            } else {
                                // Check if user was found in the database
                                if (!user) {
                                    res.json({ success: false, message: 'Unable to authenticate user.' });
                                } else {
                                    // Check if user logged in the the one requesting to update blog post
                                    if (!user.isAdmin) {
                                        res.json({ success: false, message: 'You are not authorized to approve this blog post.' });
                                    } else {
                                        blog.isApproved = true;
                                        blog.approvedBy = user.username;
                                        blog.approvedOn = Date.now();
                                        blog.save((err) => {
                                            if (err) {
                                                if (err.errors) {
                                                    res.json({ success: false, message: 'Please ensure form is filled out properly' });
                                                } else {
                                                    res.json({ success: false, message: err });
                                                }
                                            } else {
                                                res.json({ success: true, message: 'Blog Approved!' });
                                            }
                                        });
                                    }
                                }
                            }
                        });
                    }
                }
            });
        }
    });


    // Disapprove blog
    router.put('/disApproveBlog', (req, res) => {
        // Check if id was provided
        if (!req.body._id && !req.body.rejectionReason) {
            res.json({ success: false, message: 'Please provide blog id and rejection reason.' });
        } else {
            // Check if id exists in database
            Blog.findOne({ _id: req.body._id }, (err, blog) => {
                // Check if id is a valid ID
                if (err) {
                    res.json({ success: false, message: 'Not a valid blog id' });
                } else {
                    // Check if id was found in the database
                    if (!blog) {
                        res.json({ success: false, message: 'Blog id was not found.' });
                    } else {
                        // Check who user is that is requesting blog update
                        User.findOne({ _id: req.decoded.userId }, (err, user) => {
                            // Check if error was found
                            if (err) {
                                res.json({ success: false, message: err });
                            } else {
                                // Check if user was found in the database
                                if (!user) {
                                    res.json({ success: false, message: 'Unable to authenticate user.' });
                                } else {
                                    // Check if user logged in the the one requesting to update blog post
                                    if (!user.isAdmin) {
                                        res.json({ success: false, message: 'You are not authorized to approve this blog post.' });
                                    } else {
                                        blog.isApproved = false;
                                        blog.approvedBy = user.username;
                                        blog.approvedOn = Date.now();
                                        blog.rejectionReason = req.body.rejectionReason;
                                        blog.save((err) => {
                                            if (err) {
                                                if (err.errors) {
                                                    res.json({ success: false, message: 'Please ensure form is filled out properly' });
                                                } else {
                                                    res.json({ success: false, message: err });
                                                }
                                            } else {
                                                res.json({ success: true, message: 'Blog Disapproved!' });
                                            }
                                        });
                                    }
                                }
                            }
                        });
                    }
                }
            });
        }
    });


    // Delete blog by id
    router.delete('/deleteBlog/:id', (req, res) => {
        // Check if ID was provided in parameters
        if (!req.params.id) {
            res.json({ success: false, message: 'No id provided' });
        } else {
            // Check if id is found in database
            Blog.findOne({ _id: req.params.id }, (err, blog) => {
                // Check if error was found
                if (err) {
                    res.json({ success: false, message: 'Invalid id' });
                } else {
                    // Check if blog was found in database
                    if (!blog) {
                        res.json({ success: false, messasge: 'Blog was not found' });
                    } else {
                        // Get info on user who is attempting to delete post
                        User.findOne({ _id: req.decoded.userId }, (err, user) => {
                            // Check if error was found
                            if (err) {
                                res.json({ success: false, message: err });
                            } else {
                                // Check if user's id was found in database
                                if (!user) {
                                    res.json({ success: false, message: 'Unable to authenticate user.' });
                                } else {
                                    // Check if user attempting to delete blog is the same user who originally posted the blog
                                    if (user.username !== blog.createdBy) {
                                        res.json({ success: false, message: 'You are not authorized to delete this blog post' });
                                    } else {
                                        // Remove the blog from database
                                        blog.remove((err) => {
                                            if (err) {
                                                res.json({ success: false, message: err });
                                            } else {
                                                res.json({ success: true, message: 'Blog deleted!' });
                                            }
                                        });
                                    }
                                }
                            }
                        });
                    }
                }
            });
        }
    });

    // Like a blog post
    router.put('/likeBlog', (req, res) => {
        // Check if id was passed provided in request body
        if (!req.body.id) {
            res.json({ success: false, message: 'No id was provided.' });
        } else {
            // Search the database with id
            Blog.findOne({ _id: req.body.id }, (err, blog) => {
                // Check if error was encountered
                if (err) {
                    res.json({ success: false, message: 'Invalid blog id' });
                } else {
                    // Check if id matched the id of a blog post in the database
                    if (!blog) {
                        res.json({ success: false, message: 'That blog was not found.' });
                    } else {
                        // Get data from user that is signed in
                        User.findOne({ _id: req.decoded.userId }, (err, user) => {
                            // Check if error was found
                            if (err) {
                                res.json({ success: false, message: 'Something went wrong.' });
                            } else {
                                // Check if id of user in session was found in the database
                                if (!user) {
                                    res.json({ success: false, message: 'Could not authenticate user.' });
                                } else {
                                    // Check if user who liked post is the same user that originally created the blog post
                                    if (user.username === blog.createdBy) {
                                        res.json({ success: false, messagse: 'Cannot like your own post.' });
                                    } else {
                                        // Check if the user who liked the post has already liked the blog post before
                                        if (blog.likedBy.includes(user.username)) {
                                            res.json({ success: false, message: 'You already liked this post.' });
                                        } else {
                                            // Check if user who liked post has previously disliked a post
                                            if (blog.dislikedBy.includes(user.username)) {
                                                blog.dislikes--; // Reduce the total number of dislikes
                                                const arrayIndex = blog.dislikedBy.indexOf(user.username); // Get the index of the username in the array for removal
                                                blog.dislikedBy.splice(arrayIndex, 1); // Remove user from array
                                                blog.likes++; // Increment likes
                                                blog.likedBy.push(user.username); // Add username to the array of likedBy array
                                                // Save blog post data
                                                blog.save((err) => {
                                                    // Check if error was found
                                                    if (err) {
                                                        res.json({ success: false, message: 'Something went wrong.' });
                                                    } else {
                                                        res.json({ success: true, message: 'Blog liked!' });
                                                    }
                                                });
                                            } else {
                                                blog.likes++; // Incriment likes
                                                blog.likedBy.push(user.username); // Add liker's username into array of likedBy
                                                // Save blog post
                                                blog.save((err) => {
                                                    if (err) {
                                                        res.json({ success: false, message: 'Something went wrong.' });
                                                    } else {
                                                        res.json({ success: true, message: 'Blog liked!' });
                                                    }
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    }
                }
            });
        }
    });

    // Dislike a blog
    router.put('/dislikeBlog', (req, res) => {
        // Check if id was provided inside the request body
        if (!req.body.id) {
            res.json({ success: false, message: 'No id was provided.' });
        } else {
            // Search database for blog post using the id
            Blog.findOne({ _id: req.body.id }, (err, blog) => {
                // Check if error was found
                if (err) {
                    res.json({ success: false, message: 'Invalid blog id' });
                } else {
                    // Check if blog post with the id was found in the database
                    if (!blog) {
                        res.json({ success: false, message: 'That blog was not found.' });
                    } else {
                        // Get data of user who is logged in
                        User.findOne({ _id: req.decoded.userId }, (err, user) => {
                            // Check if error was found
                            if (err) {
                                res.json({ success: false, message: 'Something went wrong.' });
                            } else {
                                // Check if user was found in the database
                                if (!user) {
                                    res.json({ success: false, message: 'Could not authenticate user.' });
                                } else {
                                    // Check if user who disliekd post is the same person who originated the blog post
                                    if (user.username === blog.createdBy) {
                                        res.json({ success: false, messagse: 'Cannot dislike your own post.' });
                                    } else {
                                        // Check if user who disliked post has already disliked it before
                                        if (blog.dislikedBy.includes(user.username)) {
                                            res.json({ success: false, message: 'You already disliked this post.' });
                                        } else {
                                            // Check if user has previous disliked this post
                                            if (blog.likedBy.includes(user.username)) {
                                                blog.likes--; // Decrease likes by one
                                                const arrayIndex = blog.likedBy.indexOf(user.username); // Check where username is inside of the array
                                                blog.likedBy.splice(arrayIndex, 1); // Remove username from index
                                                blog.dislikes++; // Increase dislikeds by one
                                                blog.dislikedBy.push(user.username); // Add username to list of dislikers
                                                // Save blog data
                                                blog.save((err) => {
                                                    // Check if error was found
                                                    if (err) {
                                                        res.json({ success: false, message: 'Something went wrong.' });
                                                    } else {
                                                        res.json({ success: true, message: 'Blog disliked!' });
                                                    }
                                                });
                                            } else {
                                                blog.dislikes++; // Increase likes by one
                                                blog.dislikedBy.push(user.username); // Add username to list of likers
                                                // Save blog data
                                                blog.save((err) => {
                                                    // Check if error was found
                                                    if (err) {
                                                        res.json({ success: false, message: 'Something went wrong.' });
                                                    } else {
                                                        res.json({ success: true, message: 'Blog disliked!' });
                                                    }
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    }
                }
            });
        }
    });

    // Comment on a blog
    router.post('/comment', (req, res) => {
        // Check if comment was provided in request body
        if (!req.body.comment) {
            res.json({ success: false, message: 'No comment provided' });
        } else {
            // Check if id was provided in request body
            if (!req.body.id) {
                res.json({ success: false, message: 'No id was provided' });
            } else {
                // Use id to search for blog post in database
                Blog.findOne({ _id: req.body.id }, (err, blog) => {
                    // Check if error was found
                    if (err) {
                        res.json({ success: false, message: 'Invalid blog id' });
                    } else {
                        // Check if id matched the id of any blog post in the database
                        if (!blog) {
                            res.json({ success: false, message: 'Blog not found.' });
                        } else {
                            // Grab data of user that is logged in
                            User.findOne({ _id: req.decoded.userId }, (err, user) => {
                                // Check if error was found
                                if (err) {
                                    res.json({ success: false, message: 'Something went wrong' });
                                } else {
                                    // Check if user was found in the database
                                    if (!user) {
                                        res.json({ success: false, message: 'User not found.' });
                                    } else {
                                        // Add the new comment to the blog post's array
                                        blog.comments.push({
                                            comment: req.body.comment, // Comment field
                                            commentator: user.username // Person who commented
                                        });
                                        // Save blog post
                                        blog.save((err) => {
                                            // Check if error was found
                                            if (err) {
                                                res.json({ success: false, message: 'Something went wrong.' });
                                            } else {
                                                res.json({ success: true, message: 'Comment saved' });
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    }
                });
            }
        }
    });
    return router;
};
