// Import the libraries
const { body } = require('express-validator');
const { validationResult } = require('express-validator');
const express = require('express');
const app = express();
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const mongodb = require('./mongodb');
const multer = require('multer');
const bcrypt = require('bcrypt'); // For password hashing

// Access the models
const userModel = mongodb.User;
const customerModel = mongodb.Customer;
const vendorModel = mongodb.Vendor;
const shipperModel = mongodb.Shipper;
const hubModel = mongodb.Hub;
const productModel = mongodb.Product;
const orderModel = mongodb.Order;
const shoppingCartModel = mongodb.shoppingCart;

// Middleware to parse POST data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use("/uploads", express.static("uploads"))
app.set('view engine', 'ejs');

// Function to validate the password
const isPasswordValid = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/;
    return passwordRegex.test(password);
};

// Function to validate the username
const isUsernameValid = (username) => {
    const usernameRegex = /^[a-zA-Z0-9]{8,15}$/;
    return usernameRegex.test(username);
};

app.use(session({
    secret: 'fh3owjkdhfo9sdf9u',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 3600000, // Set the maximum age to 1 hour
    }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
    {
        usernameField: 'username', 
        passwordField: 'password', 
    },
    async (username, password, done) => {
        try {
        const user = await userModel.findOne({ username: username });

        if (!user) {
            // No user found with the provided username
            return done(null, false, { message: 'Incorrect username or password' });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (isPasswordMatch) {
            // Password matches, return the user
            return done(null, user);
        } else {
            // Wrong password
            return done(null, false, { message: 'Incorrect username or password' });
        }
        } catch (error) {
        return done(error);
        }
    }
));
  
passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
passport.deserializeUser(async (id, done) => {
    try {
        const user = await userModel.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});
  
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        // User is authenticated, proceed to the next middleware or route handler
        return next();
    } else {
        // User is not authenticated, redirect to the login page
        return res.redirect('/login');
    }
}

// index route
app.get('/', async (req, res) => {
    const products = await productModel.find({});
    res.render('layout', {products : products});
});

// login route
app.get('/login', (req, res) => {
    res.render('login', { req : req });
});

// signup route
app.get('/signup', (req, res) => {
    res.render('signup', { req : req });
});

// vendor signup route
app.get('/signup/vendor', (req, res) => {
    res.render('vendorsignup', { req : req });
});

// shipper signup route
app.get('/signup/shipper', async (req, res) => {
    const hubs = await hubModel.find({});
    res.render('shippersignup', {hubs : hubs, req : req });
});

// my account route
app.get('/myaccount', isAuthenticated, (req, res) => {
    const user = req.user;
    res.render('myaccount', { user: user });
});

// Define the log-out route
app.post('/logout', (req, res) => {
// Log the user out by clearing the session
    req.logout((err) => {
        if (err) {
            console.error(err);
            return res.redirect('/login');
        }
        res.redirect('/login');
    });
});
  

// about us route
app.get('/aboutus', (req, res) => {
    res.render('aboutus');
});

// privacy route
app.get('/privacy', (req, res) => {
    res.render('privacy');
});

// help route
app.get('/help', (req, res) => {
    res.render('help');
});

// vendor route
app.get('/vendor', isAuthenticated, async (req, res) => {
    try {
        const user = req.user;
        const product = await productModel.find({vendor : user._id})
        res.render('vendorpage', {products : product});
    } catch (e) {
        return res.send("A error has occured")
    }
});

// product details route
app.get('/productdetails/:id', async (req, res) => {
    const product = await productModel.findById(req.params.id);
    res.render('productdetails', {product : product});
});

app.post('/productdetails/:id', isAuthenticated, async (req, res) => {
    try {
        const product = await productModel.findById(req.params.id);
        const user = req.user;
        const newCartProduct = await new shoppingCartModel({
            product : product,
            customer : user,
        })
        await newCartProduct.save();
        res.redirect('/')
    } catch (e) {
        console.log(e);
    }

});

// cart route
app.get('/cart', isAuthenticated, async (req, res) => {
    try {
        const user = req.user;
        const cartItems = await shoppingCartModel.find({ customer: user._id }).populate('product');
        
        res.render('cart', { user: user, cartItems: cartItems }); // Pass the array to the template
    } catch (e) {
        console.log(e);
        return res.send("An error has occurred");
    }
});

app.post('/remove/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await productModel.findById(productId);
        const user = req.user;

        // Delete the product from the shopping cart for the specific user
        await shoppingCartModel.deleteOne({ product: product._id, customer: user._id });

        res.redirect('/cart');
    } catch (e) {
        console.error(e);
        return res.send("An error has occurred");
    }
});

app.post('/order', async (req, res) => {
    try {
        const user = req.user;

        // Find shopping cart items associated with the customer
        const cartItems = await shoppingCartModel.find({ customer: user._id })

        // Create an array of product references from the shopping cart items
        const productRefs = cartItems.map(cartItem => ({ product: cartItem.product._id }));

        const randomHub = await hubModel.aggregate([{ $sample: { size: 1 } }]);

        // Create a new order with the products and customer ID
        const newOrder = new orderModel({
            products: productRefs,
            customer: user._id,
            hub: randomHub[0], // Assuming 'hubModel' returns a single hub document
        });

        // Save the new order to the database
        await newOrder.save();

        // Delete the shopping cart items
        await shoppingCartModel.deleteMany({ customer: user._id });

        // Redirect to the cart page or another page as needed
        res.redirect('/cart');
    } catch (e) {
        console.error(e);
        return res.send("An error has occurred");
    }
});



// shipper route
app.get('/shipper', isAuthenticated, async (req, res) => {
    const user = req.user;
    const hub = req.user.populate('assignedDistributionHub');
    const orders = await orderModel.find({hub : user.assignedDistributionHub._id})
                                        .populate('hub')
                                        .populate('customer');
    res.render('shipperpage', {orders : orders, user : user});
});

// set status for orders
app.post('/status/:id', isAuthenticated, async (req, res) => {
    try {
        const orderId = req.params.id;
        const newStatus = req.body.status;
        const updatedOrder = await orderModel.findByIdAndUpdate(orderId, { status: newStatus }, { new: true });

        if (!updatedOrder) {
            return res.status(404).send("Order not found");
        }

        res.redirect('/shipper');
    } catch (e) {
        console.error(e);
        return res.status(500).send("An error has occurred");
    }
});

// order route
app.get('/order/:id', isAuthenticated, async (req, res) => {
    const order = await orderModel.findById(req.params.id)
                                            .populate('customer')
                                            .populate('products.product');
    res.render('order', {order : order});
});

// add product route
app.get('/addproduct', isAuthenticated, (req, res) => {
    res.render('addproduct', { errors: [] });
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {     
        cb(null, "uploads")
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + ".png")
    }
})
  
const upload = multer({ storage: storage })

app.post('/signup', upload.single('image'), async (req, res) => {
    const name = req.body.name;
    const username = req.body.username;
    const password = req.body.password;
    const address = req.body.address;
    const filename = req.file.path;

    // Validate username and password
    if (!isUsernameValid(username) || !isPasswordValid(password)) {
        return res.send('Invalid username or password format');
    }

    // Check if the username already exists in the collection
    const existingUser = await userModel.findOne({ username: username });

    if (existingUser) {
        // Username already exists, render the signup page with an error message
        return res.redirect('/signup/vendor?error=userNameAlreadyTaken');
    }

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new customer
    const newCustomer = new customerModel({ 
        username: username, 
        password: hashedPassword, 
        userType: 'customer', 
        profilePicture: filename, 
        name: name, 
        address: address
    });

    // Save the new customer to the collection
    await newCustomer.save();

    // Redirect to the login page after successful signup
    res.redirect('/login');
});


app.post('/signup/vendor', upload.single('image'), async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const businessname = req.body.businessname;
    const businessaddress = req.body.businessaddress;
    const filename = req.file.path;

    // Validate username and password
    if (!isUsernameValid(username) || !isPasswordValid(password)) {
        return res.send('Invalid username or password format');
    }

    // Check if the username already exists in the collection
    const existingUser = await userModel.findOne({ username: username });

    if (existingUser) {
        // Username already exists, render the signup page with an error message
        return res.redirect('/signup/vendor?error=userNameAlreadyTaken')
    }

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const newVendor = new vendorModel({ 
            username: username, 
            password: hashedPassword, 
            userType: 'vendor', businessName: 
            businessname, businessAddress: 
            businessaddress, 
            profilePicture: filename 
        });
        await newVendor.save();
    } catch (e) {
        res.send("Duplicate business name or business address")
    }
    // If username is not taken, insert the new user into the collection
    

    // Redirect to login page after successful signup
    res.redirect('/login');
});

app.post('/signup/shipper',  upload.single('image'), async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const hub = req.body.distributionhub;
    const filename = req.file.path;

    try {
        
        if (!isUsernameValid(username) || !isPasswordValid(password)) {
            return res.send('Invalid username or password format');
        }

        // Check if the username already exists in the collection
        const existingUser = await userModel.findOne({ name: username });

        if (existingUser) {
            // Username already exists, render the signup page with an error message
            return res.redirect('/signup/vendor?error=userNameAlreadyTaken')
        }

        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        // If username is not taken, insert the new user into the collection
        const newShipper = new shipperModel({
            username: username, 
            password: hashedPassword, 
            userType: 'shipper', 
            profilePicture: filename, 
            assignedDistributionHub: hub 
        });
        await newShipper.save();
    } catch (e) {
        return res.send('Hub is already taken')
    }
    

    // Redirect to login page after successful signup
    res.redirect('/login');
});

app.post(
    '/addproduct', isAuthenticated,
    upload.single('productImage'),
    [
      body('name')
        .isString()
        .isLength({ min: 10, max: 20 })
        .withMessage('Product name must be a text between 10 and 20 characters'),
  
      body('price')
        .isNumeric()
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
  
      body('desc')
        .isString()
        .isLength({ max: 500 })
        .withMessage('Description is at most 500 characters'),
    ],
    async (req, res) => {
        const errors = validationResult(req).array();
  
      try {
        const name = req.body.name;
        const price = req.body.price;
        const desc = req.body.desc;
        const productImage = req.file.path;
  
        // Assuming you have authenticated users and stored user information in req.user
        const vendorId = req.user._id; // Get the vendor's ID from the authenticated user
  
        if (errors.length > 0) {
            // If there are validation errors, render the form with error messages
            return res.render('addproduct', { errors });
        }

        // Create a new product with the vendor's ID
        const newProduct = new productModel({
          name: name,
          price: price,
          desc: desc,
          productImage: productImage,
          vendor: vendorId, // Set the vendor ID for the product
        });
  
        await newProduct.save();
        res.redirect('/vendor');
      } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while adding the product');
      }
    }
);

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login?error=wrongUsernameOrPassword', // Redirect on failure
  }), (req, res) => {
    // Handle the redirection based on userType
    if (req.user.userType === 'customer') {
      res.redirect('/');
    } else if (req.user.userType === 'vendor') {
      res.redirect('/vendor');
    } else if (req.user.userType === 'shipper') {
      res.redirect('/shipper');
    } else {
      res.redirect('/'); // Default redirect
    }
}); 


// Start the server and listen on port 3000
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});