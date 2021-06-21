const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;

// Blog Model Definition
const blogSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    isApproved: {
        type: Boolean
    },
    approvedOn: {
        type: Date
    },
    approvedBy: {
        type: String
    },
    rejectionReason: {
        type: String
    },
    createdBy: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    likes: {
        type: Number,
        default: 0
    },
    likedBy: {
        type: Array
    },
    dislikes: {
        type: Number, default: 0
    },
    dislikedBy: {
        type: Array
    },
    comments: [{
        comment: {
            type: String,
        },
        commentator: {
            type: String
        }
    }]
});

module.exports = mongoose.model('Blog', blogSchema);