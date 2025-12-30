// Test CORS from Figma plugin context
console.log('🧪 Testing API connection...');

const testAPI = async () => {
    try {
        console.log('📡 Attempting fetch to:', 'https://viiibe-backend-2muhra4su-alberto-contreras-projects-101c33ba.vercel.app/api/chat-gpt');

        const response = await fetch('https://viiibe-backend-2muhra4su-alberto-contreras-projects-101c33ba.vercel.app/api/chat-gpt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'test connection',
                history: []
            })
        });

        console.log('✅ Response status:', response.status);
        console.log('✅ Response headers:', [...response.headers.entries()]);

        const data = await response.json();
        console.log('✅ Response data:', data);

        return data;
    } catch (error) {
        console.error('❌ Fetch error:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        throw error;
    }
};

// Run test
testAPI();
