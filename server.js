const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Paths to data files
const FOODS_FILE = path.join(__dirname, 'public', 'data', 'foods.json');
const RECIPES_FILE = path.join(__dirname, 'public', 'data', 'recipes.json');

// Utility functions
const readJSONFile = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
};

const writeJSONFile = (filePath, data) => {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
};

// Foods endpoints
app.get('/api/foods', (req, res) => {
  const foods = readJSONFile(FOODS_FILE);
  res.json(foods);
});

app.post('/api/foods', (req, res) => {
  const foods = req.body;
  const success = writeJSONFile(FOODS_FILE, foods);
  if (success) {
    res.json({ message: 'Foods saved successfully' });
  } else {
    res.status(500).json({ error: 'Failed to save foods' });
  }
});

// Recipes endpoints
app.get('/api/recipes', (req, res) => {
  const recipes = readJSONFile(RECIPES_FILE);
  res.json(recipes);
});

app.post('/api/recipes', (req, res) => {
  const recipes = req.body;
  const success = writeJSONFile(RECIPES_FILE, recipes);
  if (success) {
    res.json({ message: 'Recipes saved successfully' });
  } else {
    res.status(500).json({ error: 'Failed to save recipes' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on http://0.0.0.0:${PORT}`);
});