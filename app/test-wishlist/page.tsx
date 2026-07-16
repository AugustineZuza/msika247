export default function TestWishlistPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Test Wishlist Page</h1>
        <p className="text-gray-600 mb-4">If you can see this page, the routing is working correctly.</p>
        <a href="/my-wishlist" className="text-blue-600 underline">
          Go to Actual Wishlist Page
        </a>
      </div>
    </div>
  )
}
