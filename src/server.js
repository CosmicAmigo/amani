const express = require('express');
const app = express();

// Use Render's port, or fallback to 3000 for local development
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});