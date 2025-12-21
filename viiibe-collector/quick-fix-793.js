// Quick fix script to update totalPins to correct value
// Run this in the popup DevTools console

chrome.storage.sync.set({ totalPins: 793 }, () => {
    console.log('✅ Total pins updated to 793');
    location.reload();
});
