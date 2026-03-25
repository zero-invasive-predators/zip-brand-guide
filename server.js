const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data', 'brands.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/api/brands', (req, res) => {
  res.json(readData());
});

app.put('/api/brands/:id', (req, res) => {
  const { id } = req.params;
  const { colors } = req.body;

  if (!Array.isArray(colors)) {
    return res.status(400).json({ error: 'colors must be an array' });
  }

  const data = readData();
  const brand = data.brands.find(b => b.id === id);

  if (!brand) {
    return res.status(404).json({ error: 'Brand not found' });
  }

  brand.colors = colors;
  writeData(data);
  res.json(brand);
});

app.listen(PORT, () => {
  console.log(`ZIP Brand running at http://localhost:${PORT}`);
});
