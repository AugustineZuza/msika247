// Shared static banners data for all banner API routes
// In a real implementation, this would be database operations
export let staticBanners = [
  {
    id: '1',
    title: "🇲🇼 Martyrs' Day Specials",
    description: "Honour the heroes with special deals and discounts",
    image: "/placeholder/banner/martyrs-day.png",
    ctaText: "Shop Now",
    ctaLink: "/shop?promotion=martyrs-day",
    bgColor: "#CE1126",
    textColor: "#FFFFFF",
    isActive: true,
    order: 1
  },
  {
    id: '2',
    title: "Launch Your Online Store",
    description: "Reach customers across Malawi. Register and start selling in under 30 minutes.",
    image: "/placeholder/banner/launch-store.png",
    ctaText: "Learn More",
    ctaLink: "/sell-with-us",
    bgColor: "#006B3F",
    textColor: "#FFFFFF",
    isActive: true,
    order: 2
  },
  {
    id: '3',
    title: "Traditional Chitenje Collection",
    description: "Beautiful traditional fabrics for every occasion",
    image: "/placeholder/banner/chitenje.png",
    ctaText: "Explore",
    ctaLink: "/shop?category=chitenje",
    bgColor: "#FCD116",
    textColor: "#000000",
    isActive: true,
    order: 3
  },
  {
    id: '4',
    title: "Founder's Day Celebration",
    description: "Celebrating our founders with exclusive offers and special promotions",
    image: "/placeholder/banner/lumban.png",
    ctaText: "Celebrate With Us",
    ctaLink: "/shop?promotion=founders-day",
    bgColor: "#006B3F",
    textColor: "#FFFFFF",
    isActive: true,
    order: 4
  },
  {
    id: '5',
    title: "Top Picks for You",
    description: "Handpicked products from verified sellers",
    image: "/placeholder/banner/top-picks.png",
    ctaText: "Shop Now",
    ctaLink: "/shop?featured=top-picks",
    bgColor: "#006B3F",
    textColor: "#FFFFFF",
    isActive: true,
    order: 5
  }
]
