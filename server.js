import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
const app = express();
const port = 3000;

app.use(cors());

app.get('/dimensions', (req, res) => {
    const datasetUrl = req.query.url; 
    if (!datasetUrl) {
        return res.status(400).send('Dataset URL is required');
    }

    fetch(datasetUrl)
        .then(response => response.json())
        .then(data => res.json(data))
        .catch(error => res.status(500).send(`Error fetching dimensions: ${error}`));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
