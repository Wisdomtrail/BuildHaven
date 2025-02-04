const express = require('express');
const cors = require('cors');  // Import the cors package
const app = express();
const productRoutes = require('./src/routes/productRoutes'); 
const userRoutes = require('./src/routes/userRoutes');  
require('./src/config/db');
require('./src/config/passport');
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/product', productRoutes);  
app.use('/user', userRoutes);  

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
