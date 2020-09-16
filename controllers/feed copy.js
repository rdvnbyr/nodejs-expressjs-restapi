const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = (req, res, next) => {
    const currentPage = req.query.page || 1;// page undefined ise her zaman baslanicta 1 sayfa response eder.
    const perPage = 3;
    let totalItems;
    Post.find()
        .countDocuments()
        .then(count => {
            totalItems = count;
            return Post.find()
                .skip((currentPage - 1) * perPage)
                .limit(perPage)
        })
        .then(posts => {
            res.status(200).json({message: 'Fetched posts successfully', posts: posts, totalItems: totalItems});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);// middleware aktarimi app js
        });


};

exports.createPost = (req,res,next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed');
        error.statusCode = 422;
        throw error;
        // return res.status(422).json({
        //     message: 'Validation failed',
        //     errors: errors.array()
        // });
    };
    if (!req.file) {
        const error = new Error('No image provided');
        error.statusCode = 422;
        throw error;
    };
    const imageUrl = req.file.path;
    const title = req.body.title;
    const content = req.body.content;
    let creator;
    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: req.userId
    });
    post.save()
        .then(() => {
            return User.findById(req.userId)
        })
        .then(user => {
            creator = user;
            user.posts.push(post);
            return user.save();
        })
        .then(result => {
            console.log('createPost',post);
            console.log('createPost-result',result);
            res.status(201).json({
                message: 'Post created successfully',
                post: post,
                creator: {
                    _id: creator._id,
                    name: creator.name
                }
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);// middleware aktarimi app js
        });

};

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Could not found post.');
                error.statusCode = 404;
                throw error;
            };
            res.status(200).json({message: 'Post fetched', post: post});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);// middleware aktarimi app js
        })
};

exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed');
        error.statusCode = 422;
        throw error;
    };
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if (req.file) {
        imageUrl = req.file.path;
    };
    if (!imageUrl) {
        const error = new Error('No file pict');
        error.statusCode = 422;
        throw error;
    }
    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Could not found post.');
                error.statusCode = 404;
                throw error;
            };
            if (post.creator.toString() !== req.userId) {
                const error = new Error('Not authorize');
                error.statusCode = 403;
                throw error;
            };
            if (imageUrl !== post.imageUrl) {
                clearImage(post.imageUrl);
            };
            post.title = title;
            post.imageUrl = imageUrl;
            post.content = content;
            return post.save();
        })
        .then(result => {
            res.status(200).json({message: 'Post fetched', post: result});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Could not found post.');
                error.statusCode = 404;
                throw error;
            };
            if (post.creator.toString() !== req.userId) {
                const error = new Error('Not authorize');
                error.statusCode = 403;
                throw error;
            };
            // check post
            clearImage(post.imageUrl);
            return Post.findByIdAndRemove(postId);
        })
        .then(() => {
            return User.findById(req.userId);
        })
        .then(user => {
            user.posts.pull(postId);
            return user.save();
        })
        .then(result => {
            console.log(result);
            res.status(200).json({message: 'Deleted Post'})
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
};