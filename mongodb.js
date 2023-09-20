const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://emruy:lacloi123@cluster0.ejie4zu.mongodb.net/Full-stackWebApplication?retryWrites=true&w=majority')
    .then(() => console.log('Connect to MongoDB Atlas'))
    .catch((error) => console.log(error.message));

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    userType: {
        type: String,
        required: true,
        enum: ['customer', 'vendor', 'shipper'],
    },
    profilePicture: {
        type: String,
        required: true,
    },
}, { discriminatorKey: 'userType' });
    
const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    // Additional fields specific to customers
    address: {
        type: String,
        required: true,
    },
});

const vendorSchema = new mongoose.Schema({
    // Additional fields specific to vendors
    businessName: {
        type: String,
        required: true,
        unique: true,
    },
    businessAddress: {
        type: String,
        required: true,
        unique: true,
    },
});

const shipperSchema = new mongoose.Schema({
    // Additional fields specific to shippers
    assignedDistributionHub: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hub",
        required: true,
    },
});

const hubSchema = new mongoose.Schema({
    // Additional fields specific to shippers
    name: {
        type: String,
        require: true,
        unique: true,
    },
    address: {
        type: String,
        require: true,
        unique: true,
    },
});

const productSchema = new mongoose.Schema({
    // Additional fields specific to shippers
    name: {
        type: String,
        require: true,
    },
    price: {
        type: Number,
        require: true,
    },
    desc: {
        type: String,
        require: true,
    },
    productImage: {
        type: String, // You can store the path to the image file
        required: true,
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vendor",
        required: true,
    },
});

const orderSchema = new mongoose.Schema({
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        }
    }],

    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    total: {
        type: Number,
        require: true,
    },

    hub: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hub",
        required: true,
    },

    status: {
        type: String,
        default: "Active",
        require: true,
    }
});

const shoppingCartSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },

    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
});

// Create models
const User = mongoose.model("User", userSchema);
const Hub = mongoose.model('Hub', hubSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model("Order", orderSchema);
const shoppingCart = mongoose.model("Cart", shoppingCartSchema);

// Define discriminators for different user types
const Customer = User.discriminator('customer', customerSchema);
const Vendor = User.discriminator('vendor', vendorSchema);
const Shipper = User.discriminator('shipper', shipperSchema);

// Export models
module.exports = {
    User,
    Customer,
    Vendor,
    Shipper,
    Hub,
    Product,
    Order,
    shoppingCart
};
