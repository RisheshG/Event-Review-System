const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(bodyParser.json());

// Create PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'Rishesh@123',
  port: 5432,
});

// Authentication middleware
const authenticateUser = (req, res, next) => {
  // Implement authentication logic here
  // For demonstration purposes, let's assume all requests are authenticated
  next();
};

// Submit review endpoint
app.post('/submit_review', authenticateUser, async (req, res) => {
  // Extract review data from request body
  const { eventId, registrationExperience, eventExperience, breakfastExperience, overallRating } = req.body;

  // SQL query to insert review into database
  const sql = `
    INSERT INTO reviews (event_id, registration_experience, event_experience, breakfast_experience, overall_rating)
    VALUES ($1, $2, $3, $4, $5)
  `;
  const values = [eventId, registrationExperience, eventExperience, breakfastExperience, overallRating];

  try {
    // Execute SQL query
    await pool.query(sql, values);
    console.log('Review submitted successfully');
    res.json({ message: 'Review submitted successfully' });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Like review endpoint
app.post('/like_review/:reviewId', authenticateUser, async (req, res) => {
  // Extract review ID from request parameters
  const reviewId = req.params.reviewId;

  // SQL query to update likes for the review
  const sql = `UPDATE reviews SET likes = likes + 1 WHERE id = $1`;
  const values = [reviewId];

  try {
    // Execute SQL query
    await pool.query(sql, values);
    console.log('Review liked successfully');
    res.json({ message: 'Review liked successfully' });
  } catch (error) {
    console.error('Error liking review:', error);
    res.status(500).json({ error: 'Failed to like review' });
  }
});

// Report review endpoint
app.post('/report_review/:reviewId', authenticateUser, async (req, res) => {
  // Extract review ID from request parameters
  const reviewId = req.params.reviewId;

  // SQL query to update reports for the review and flag it if reported more than five times
  const sql = `UPDATE reviews SET reports = reports + 1, flagged = (reports >= 5) WHERE id = $1`;
  const values = [reviewId];

  try {
    // Execute SQL query
    await pool.query(sql, values);
    console.log('Review reported successfully');
    res.json({ message: 'Review reported successfully' });
  } catch (error) {
    console.error('Error reporting review:', error);
    res.status(500).json({ error: 'Failed to report review' });
  }
});

// Respond to review endpoint
app.post('/respond_to_review/:reviewId', authenticateUser, async (req, res) => {
  // Extract review ID from request parameters and response from request body
  const reviewId = req.params.reviewId;
  const response = req.body.response;

  // SQL query to update response for the review
  const sql = `UPDATE reviews SET response = $1 WHERE id = $2`;
  const values = [response, reviewId];

  try {
    // Execute SQL query
    await pool.query(sql, values);
    console.log('Response added successfully');
    res.json({ message: 'Response added successfully' });
  } catch (error) {
    console.error('Error responding to review:', error);
    res.status(500).json({ error: 'Failed to add response' });
  }
});

// Generate summary endpoint
app.get('/generate_summary/:eventId', async (req, res) => {
  // Extract event ID from request parameters
  const eventId = req.params.eventId;

  // SQL query to calculate overall rating for the specified event ID
  const sql = `SELECT ROUND(AVG(overall_rating)) AS avg_overall_rating FROM reviews WHERE event_id = $1`;
  const values = [eventId];

  try {
    // Execute SQL query
    const result = await pool.query(sql, values);

    // Check if overall rating is available for the specified event ID
    if (result.rows.length === 0 || result.rows[0].avg_overall_rating === null) {
      // No ratings found for the specified event ID
      res.status(404).json({ error: 'No ratings found for the specified event ID' });
    } else {
      // Ratings retrieved successfully
      console.log('Overall rating retrieved successfully');
      const overallRating = result.rows[0].avg_overall_rating;
      let summary = '';

      // Generate summary based on overall rating
      if (overallRating === 5) {
        summary = 'It was a wonderful experience';
      } else if (overallRating === 4) {
        summary = 'It was a good event overall';
      } else if (overallRating === 3) {
        summary = 'It was a very average event';
      } else if (overallRating === 2) {
        summary = 'It could have been better event';
      } else if (overallRating === 1) {
        summary = 'It was a bad experience';
      }

      res.json({ message: 'Summary generated successfully', summary: summary });
    }
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// Retrieve ratings endpoint
app.get('/retrieve_ratings/:eventId', async (req, res) => {
  // Extract event ID from request parameters
  const eventId = req.params.eventId;

  // SQL query to calculate average ratings for each criterion for the specified event ID
  const sql = `SELECT ROUND(AVG(registration_experience), 2) AS avg_registration_experience,
                      ROUND(AVG(event_experience), 2) AS avg_event_experience,
                      ROUND(AVG(breakfast_experience), 2) AS avg_breakfast_experience,
                      ROUND(AVG(overall_rating), 2) AS avg_overall_rating
               FROM reviews
               WHERE event_id = $1`;
  const values = [eventId];

  try {
    // Execute SQL query
    const result = await pool.query(sql, values);

    // Check if ratings are available for the specified event ID
    if (result.rows.length === 0) {
      // No ratings found for the specified event ID
      res.status(404).json({ error: 'No ratings found for the specified event ID' });
    } else {
      // Ratings retrieved successfully
      console.log('Ratings retrieved successfully');
      res.json({ message: 'Ratings retrieved successfully', ratings: result.rows[0] });
    }
  } catch (error) {
    console.error('Error retrieving ratings:', error);
    res.status(500).json({ error: 'Failed to retrieve ratings' });
  }
});

// Pagination endpoint
app.get('/reviews', async (req, res) => {
  // Extract pagination parameters from query string
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;

  // Calculate offset based on pagination parameters
  const offset = (page - 1) * perPage;

  // SQL query to retrieve paginated reviews
  const sql = `SELECT * FROM reviews ORDER BY id OFFSET $1 LIMIT $2`;
  const values = [offset, perPage];

  try {
    // Execute SQL query
    const result = await pool.query(sql, values);
    console.log('Reviews retrieved successfully');
    res.json({ message: 'Reviews retrieved successfully', reviews: result.rows });
  } catch (error) {
    console.error('Error retrieving reviews:', error);
    res.status(500).json({ error: 'Failed to retrieve reviews' });
  }
});

// Root URL handler to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));