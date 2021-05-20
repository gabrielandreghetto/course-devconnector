const express                     = require('express');
const { check, validationResult } = require('express-validator');

const auth = require('../../middleware/auth');

const Post      = require('../../models/Post');
const User      = require('../../models/User');
const Profile   = require('../../models/Profile');

const router = express.Router();

router.post(
    '/', 
    [
        auth,
        [
            check('text', 'text is required').not().isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            return res.status(400).json( { errors: errors.array() })
        }

        try {
            const user = await User.findById(req.user.id).select('-password');
    
            const newPost = {
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            };

            const post = new Post(newPost);
            
            await post.save();

            res.json(post);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('server error')
        }
    }
);

router.get(
    '/', 
    auth,
    async (req, res) => {
        try {
            const posts = await Post.find().sort({ date: -1 });

            res.json(posts);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('server error')
        }
    }
);

router.get(
    '/:id', 
    auth,
    async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);

            if (!post) {
                return res.status(404).json({ msg: 'post not found' });
            }

            res.json(post);
        } catch (err) {
            console.error(err.message);

            if (err.kind == 'ObjectId') {
                return res.status(400).json({ msg: 'post not found' });
            }

            res.status(500).send('server error')
        }
    }
);

router.delete(
    '/:id', 
    auth,
    async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);

            if (!post) {
                return res.status(404).json({ msg: 'post not found' });
            }

            if (post.user.toString() !== req.user.id.toString()) {
                return res.status(403).json({ msg: 'user not authorized' });
            }

            await post.remove();

            res.json({ msg: 'post removed' });
        } catch (err) {
            console.error(err.message);

            if (err.kind == 'ObjectId') {
                return res.status(400).json({ msg: 'post not found' });
            }

            res.status(500).send('server error')
        }
    }
);

router.put(
    '/like/:id', 
    auth,
    async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);
    
            if (!post) {
                return res.status(404).json({ msg: 'post not found' });
            }

            if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
                return res.status(400).json({ msg: 'post already liked' })
            }
            
            post.likes.unshift({ user: req.user.id });

            await post.save()

            res.json(post.likes);
        } catch (err) {
            console.error(err.message);

            if (err.kind == 'ObjectId') {
                return res.status(400).json({ msg: 'post not found' });
            }

            res.status(500).send('server error')
        }
    }
);

router.put(
    '/unlike/:id', 
    auth,
    async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);
    
            if (!post) {
                return res.status(404).json({ msg: 'post not found' });
            }

            if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
                return res.status(400).json({ msg: 'post was not liked' })
            }

            const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);

            post.likes.splice(removeIndex, 1);

            await post.save()

            res.json(post.likes);
        } catch (err) {
            console.error(err.message);

            if (err.kind == 'ObjectId') {
                return res.status(400).json({ msg: 'post not found' });
            }

            res.status(500).send('server error')
        }
    }
);

router.post(
    '/comment/:id', 
    [
        auth,
        [
            check('text', 'text is required').not().isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            return res.status(400).json( { errors: errors.array() })
        }

        try {
            const post = await Post.findById(req.params.id);
    
            if (!post) {
                return res.status(404).json({ msg: 'post not found' });
            }

            const user = await User.findById(req.user.id).select('-password');
    
            const newComment = {
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            };

            post.comments.unshift(newComment);
            
            await post.save();

            res.json(post.comments);
        } catch (err) {
            console.error(err.message);

            if (err.kind == 'ObjectId') {
                return res.status(400).json({ msg: 'post not found' });
            }

            res.status(500).send('server error')
        }
    }
);

router.delete(
    '/comment/:id/:comment_id', 
    auth,
    async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);
    
            if (!post) {
                return res.status(404).json({ msg: 'post not found' });
            }

            const comment = post.comments.find(comment => comment.id.toString() === req.params.comment_id.toString());
    
            if (!comment) {
                return res.status(404).json({ msg: 'comment not found' });
            }

            if (comment.user.toString() !== req.user.id.toString()) {
                return res.status(400).json({ msg: 'post was not liked' })
            }

            const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);

            post.comments.splice(removeIndex, 1);

            await post.save()

            res.json(post.comments);
        } catch (err) {
            console.error(err.message);

            if (err.kind == 'ObjectId') {
                return res.status(400).json({ msg: 'post not found' });
            }

            res.status(500).send('server error')
        }
    }
);

module.exports = router;
