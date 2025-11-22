// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Allows your HTML to talk to this server
app.use(bodyParser.json());

// MongoDB Connection (Replace with your connection string if using Cloud)
mongoose.connect('mongodb://127.0.0.1:27017/lego-builder')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// User Schema
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// Build Schema (Updated to include user reference)
const BuildSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: String, // Optional name
    createdAt: { type: Date, default: Date.now },
    bricks: [
        {
            x: Number,
            y: Number,
            z: Number,
            width: Number,
            depth: Number,
            color: Number, // Hex color
            rotation: Number
        }
    ]
});

const Build = mongoose.model('Build', BuildSchema);

// --- API ROUTES ---

// Authentication Routes

// Signup
app.post('/api/signup', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required' });
        }

        if (username.length < 3) {
            return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            username,
            password: hashedPassword
        });

        await newUser.save();
        console.log(`New user created: ${username}`);
        res.json({ success: true, message: 'Account created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required' });
        }

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        console.log(`User logged in: ${username}`);
        res.json({
            success: true,
            userId: user._id,
            username: user.username,
            message: 'Login successful'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Build Routes (Updated for user authentication)

// 1. Save a new build
app.post('/api/save', async (req, res) => {
    try {
        const { bricks, userId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const newBuild = new Build({
            userId,
            bricks
        });
        const saved = await newBuild.save();
        console.log("Build Saved!");
        res.json({ success: true, id: saved._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get the history (List of builds for a specific user)
app.get('/api/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        // Get last 10 builds for this user, newest first
        const builds = await Build.find({ userId }).sort({ createdAt: -1 }).limit(10);
        res.json(builds);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Load a specific build
app.get('/api/load/:id', async (req, res) => {
    try {
        const build = await Build.findById(req.params.id);
        if (!build) {
            return res.status(404).json({ success: false, message: 'Build not found' });
        }
        res.json(build);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Lego Server running at http://localhost:${PORT}`);
});