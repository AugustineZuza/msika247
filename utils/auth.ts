export async function handleSignOut() {
  // Demo sign out - just redirect
  if (typeof window !== 'undefined') {
    window.location.href = '/'
  }
}
