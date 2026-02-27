// Simple toast notification fallback since react-hot-toast isn't available
interface ToastOptions {
  duration?: number
}

const toast = {
  success: (message: string, options?: ToastOptions) => {
    // Create a simple success notification
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2'
    notification.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>${message}</span>
    `
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.remove()
    }, options?.duration || 3000)
  },
  
  error: (message: string, options?: ToastOptions) => {
    // Create a simple error notification
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2'
    notification.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
      <span>${message}</span>
    `
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.remove()
    }, options?.duration || 3000)
  }
}

export default toast
