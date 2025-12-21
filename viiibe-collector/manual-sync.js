// MANUAL SYNC SCRIPT
// Run this in the popup DevTools console to get the real count from backend

(async function syncRealCount() {
    console.log('🔄 Starting manual sync...');

    // Get admin key
    const { adminKey } = await chrome.storage.sync.get(['adminKey']);

    if (!adminKey) {
        console.error('❌ No admin key found. Please set it in Settings first.');
        return;
    }

    try {
        // Call the backend directly with a simple fetch
        const API_BASE = 'https://viiibe-backend-nfueitpl1-alberto-contreras-projects-101c33ba.vercel.app/api';

        console.log('📡 Fetching from backend...');
        const response = await fetch(`${API_BASE}/get-saved-pins?adminKey=${adminKey}&limit=1`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        console.log('📊 Backend response:', data);
        console.log('📊 Real total from KV:', data.total);

        // Get current cache
        const { totalPins: cachedTotal } = await chrome.storage.sync.get(['totalPins']);
        console.log('💾 Current cached total:', cachedTotal);
        console.log('📉 Difference:', data.total - cachedTotal);

        // Update cache
        await chrome.storage.sync.set({ totalPins: data.total });
        console.log('✅ Cache updated to:', data.total);

        // Reload stats
        location.reload();

    } catch (error) {
        console.error('❌ Sync failed:', error);
        console.error('Error details:', error.message);
    }
})();
