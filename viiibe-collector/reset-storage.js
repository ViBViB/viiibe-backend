// Reset Extension Storage Script
// Run this in the browser console on any page to reset the extension storage

console.log('🔄 Resetting Viiibe Collector storage...');

// Reset all storage values
chrome.storage.sync.set({
    adminKey: 'viiibe-curator-2025',
    totalPins: 0,
    defaultCategory: 'uncategorized'
}, () => {
    console.log('✅ Storage reset complete!');
    console.log('📊 New values:');
    console.log('  - adminKey: viiibe-curator-2025');
    console.log('  - totalPins: 0');
    console.log('  - defaultCategory: uncategorized');

    // Verify
    chrome.storage.sync.get(['adminKey', 'totalPins', 'defaultCategory'], (result) => {
        console.log('\n✅ Verified storage:', result);
    });
});
