import { 
  Store, 
  Smartphone, 
  Shirt, 
  Package, 
  Heart, 
  Sun, 
  Home, 
  Car, 
  Star,
  Baby,
  Book,
  Dumbbell,
  Wrench
} from 'lucide-react'

// Unified categories for the entire application
export const UNIFIED_CATEGORIES = [
  { 
    name: 'All Categories', 
    slug: 'all',
    icon: Store, 
    color: 'bg-gray-100 text-gray-600' 
  },
  { 
    name: 'Electronics & Technology', 
    slug: 'electronics-technology',
    icon: Smartphone, 
    color: 'bg-blue-100 text-blue-600' 
  },
  { 
    name: 'Fashion & Clothing', 
    slug: 'fashion-clothing',
    icon: Shirt, 
    color: 'bg-pink-100 text-pink-600' 
  },
  { 
    name: 'Beauty, Health & Personal Care', 
    slug: 'beauty-health-personal-care',
    icon: Heart, 
    color: 'bg-red-100 text-red-600' 
  },
  { 
    name: 'Home, Furniture & Appliances', 
    slug: 'home-furniture-appliances',
    icon: Home, 
    color: 'bg-purple-100 text-purple-600' 
  },
  { 
    name: 'Food, Groceries & Beverages', 
    slug: 'food-groceries-beverages',
    icon: Package, 
    color: 'bg-green-100 text-green-600' 
  },
  { 
    name: 'Baby, Kids & Toys', 
    slug: 'baby-kids-toys',
    icon: Baby, 
    color: 'bg-yellow-100 text-yellow-600' 
  },
  { 
    name: 'Sports, Fitness & Outdoor', 
    slug: 'sports-fitness-outdoor',
    icon: Dumbbell, 
    color: 'bg-orange-100 text-orange-600' 
  },
  { 
    name: 'Automotive & Motor Accessories', 
    slug: 'automotive-motor-accessories',
    icon: Car, 
    color: 'bg-gray-100 text-gray-600' 
  },
  { 
    name: 'Books, Education & Stationery', 
    slug: 'books-education-stationery',
    icon: Book, 
    color: 'bg-indigo-100 text-indigo-600' 
  },
  { 
    name: 'Tools, Hardware & Industrial', 
    slug: 'tools-hardware-industrial',
    icon: Wrench, 
    color: 'bg-teal-100 text-teal-600' 
  },
  { 
    name: 'Agriculture & Farming', 
    slug: 'agriculture-farming',
    icon: Sun, 
    color: 'bg-green-100 text-green-600' 
  }
]

// For database seeding (without icons and colors)
export const DATABASE_CATEGORIES = UNIFIED_CATEGORIES
  .filter(cat => cat.name !== 'All Categories')
  .map(({ name, slug, description }) => ({
    name,
    slug,
    description: getDescription(name)
  }))

function getDescription(name: string): string {
  const descriptions: Record<string, string> = {
    'Electronics & Technology': 'Electronic devices, gadgets, and technology products',
    'Fashion & Clothing': 'Clothing, accessories, and fashion items',
    'Beauty, Health & Personal Care': 'Beauty products, health items, and personal care essentials',
    'Home, Furniture & Appliances': 'Furniture, home decor, and household appliances',
    'Food, Groceries & Beverages': 'Food items, groceries, and beverages',
    'Baby, Kids & Toys': 'Baby products, kids items, and toys',
    'Sports, Fitness & Outdoor': 'Sports equipment, fitness gear, and outdoor items',
    'Automotive & Motor Accessories': 'Car parts, motor accessories, and automotive supplies',
    'Books, Education & Stationery': 'Books, educational materials, and stationery supplies',
    'Tools, Hardware & Industrial': 'Tools, hardware, and industrial equipment',
    'Agriculture & Farming': 'Agricultural products, farming equipment, and supplies'
  }
  return descriptions[name] || ''
}
