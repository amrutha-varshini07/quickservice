require('dotenv').config();
const mongoose = require('mongoose');
const FoodItem = require('./models/FoodItem');

const MONGODB_URI = process.env.MONGODB_URI;

const QUICKSERVE_FOOD_ITEMS = [
  {
    id: 1,
    name: 'Hyderabadi Chicken Biryani',
    category: 'biryani',
    categoryLabel: 'Biryani & Rice',
    price: 299,
    isVeg: false,
    rating: 4.9,
    description: 'Slow-cooked aromatic basmati rice layered with marinated tender chicken and royal Indian spices.',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 2,
    name: 'Paneer Butter Masala',
    category: 'curry',
    categoryLabel: 'Main Curries',
    price: 249,
    isVeg: true,
    rating: 4.8,
    description: 'Fresh cottage cheese cubes simmered in rich, velvety tomato and cashew butter gravy.',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 3,
    name: 'Butter Chicken (Murgh Makhani)',
    category: 'curry',
    categoryLabel: 'Main Curries',
    price: 320,
    isVeg: false,
    rating: 4.9,
    description: 'Tender tandoori chicken cooked in creamy satin-smooth tomato sauce infused with fenugreek.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Butter_Chicken_%26_Butter_Naan_-_Home_-_Chandigarh_-_India_-_0006.jpg/800px-Butter_Chicken_%26_Butter_Naan_-_Home_-_Chandigarh_-_India_-_0006.jpg'
  },
  {
    id: 4,
    name: 'Crispy Masala Dosa',
    category: 'southindian',
    categoryLabel: 'South Indian',
    price: 139,
    isVeg: true,
    rating: 4.7,
    description: 'Crispy golden fermented crepe stuffed with spiced potato mash, served with sambar and fresh coconut chutney.',
    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 5,
    name: 'Farmhouse Margherita Pizza',
    category: 'fastfood',
    categoryLabel: 'Fast Food',
    price: 279,
    isVeg: true,
    rating: 4.6,
    description: 'Hand-stretched dough topped with San Marzano tomato sauce, fresh mozzarella, and sweet basil.',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 6,
    name: 'Crispy Zinger Chicken Burger',
    category: 'fastfood',
    categoryLabel: 'Fast Food',
    price: 199,
    isVeg: false,
    rating: 4.7,
    description: 'Juicy crumb-fried chicken breast with crunchy lettuce and spicy mayo in a toasted brioche bun.',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 7,
    name: 'Royal Veg Dum Biryani',
    category: 'biryani',
    categoryLabel: 'Biryani & Rice',
    price: 229,
    isVeg: true,
    rating: 4.7,
    description: 'Garden fresh vegetables and fried paneer slow-cooked on dum with fragrant saffron rice.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Veg_Biryani.jpg/800px-Veg_Biryani.jpg'
  },
  {
    id: 8,
    name: 'Steamed Idli Sambar Platter',
    category: 'southindian',
    categoryLabel: 'South Indian',
    price: 99,
    isVeg: true,
    rating: 4.6,
    description: 'Soft pillow-like steamed rice cakes served with piping hot piping lentil sambar & three chutneys.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Idli_Sambar.JPG/800px-Idli_Sambar.JPG'
  },
  {
    id: 9,
    name: 'Gulab Jamun with Rabdi (2 pcs)',
    category: 'desserts',
    categoryLabel: 'Desserts & Drinks',
    price: 119,
    isVeg: true,
    rating: 4.9,
    description: 'Melt-in-mouth milk dumplings soaked in cardamom sugar syrup and garnished with thick malai rabdi.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Gulab-jamun-wallpaper-1.jpg/800px-Gulab-jamun-wallpaper-1.jpg'
  },
  {
    id: 10,
    name: 'Mango Lassi & Refreshing Mint',
    category: 'desserts',
    categoryLabel: 'Desserts & Drinks',
    price: 89,
    isVeg: true,
    rating: 4.8,
    description: 'Creamy Alphonso mango yogurt smoothie churned fresh and topped with chopped pistachios.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Mango-Lassi.jpg/800px-Mango-Lassi.jpg'
  }
];

async function seedDatabase() {
  if (!MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI environment variable is not defined.');
    console.error('Please create a .env file with your MongoDB connection string:');
    console.error('MONGODB_URI=your_mongodb_connection_uri\n');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    console.log('Seeding food items into "FoodItems" collection...');

    // Upsert operations by unique "id" to avoid duplicate records when run repeatedly
    const bulkOperations = QUICKSERVE_FOOD_ITEMS.map(item => ({
      updateOne: {
        filter: { id: item.id },
        update: { $set: item },
        upsert: true
      }
    }));

    const result = await FoodItem.bulkWrite(bulkOperations);

    console.log(`✅ Upserted ${result.upsertedCount} new items, updated ${result.modifiedCount} existing items.`);

    const totalCount = await FoodItem.countDocuments();
    console.log(`Total food items in FoodItems collection: ${totalCount}`);

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed script error:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
}

seedDatabase();
