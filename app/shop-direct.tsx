export default function ShopDirectPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Shop Direct Page</h1>
        <p className="text-gray-600 mb-8">This shop page is outside the (shop) route group to test routing.</p>
        
        <div className="bg-white rounded-lg shadow-sm p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Direct Shop Route Working!</h2>
          <p className="text-gray-600">This confirms the issue is with the (shop) route group.</p>
        </div>
      </div>
    </div>
  )
}
