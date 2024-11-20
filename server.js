require('dotenv').config(); 
const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000; 

app.get('/api/places', async (req, res) => {
  const { query } = req.query;

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query: query,
        key: process.env.GOOGLE_API_KEY 
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching data from Google Places API:', error);
    res.status(500).send('Error fetching data');
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
