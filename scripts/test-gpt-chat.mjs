#!/usr/bin/env node

/**
 * Test script for GPT-4 chat endpoint
 * Usage: node scripts/test-gpt-chat.mjs
 */

const API_URL = 'https://viiibe-backend-rc2dhfcsm-alberto-contreras-projects-101c33ba.vercel.app/api/chat-gpt';

async function testChat() {
    console.log('🧪 Testing GPT-4 Chat Endpoint\n');

    // Test 1: Initial message
    console.log('Test 1: Initial user message');
    console.log('User: "I need a homepage for a transportation company"\n');

    const response1 = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'I need a homepage for a transportation company',
            history: [],
        }),
    });

    const data1 = await response1.json();
    console.log('GPT-4:', data1.reply);
    console.log('PRD Update:', JSON.stringify(data1.prdUpdate, null, 2));
    console.log('Tokens used:', data1.usage.totalTokens);
    console.log('\n---\n');

    // Test 2: Follow-up with more details
    console.log('Test 2: Follow-up with details');
    console.log('User: "Red color, Apple style, targeting multinational clients"\n');

    const history = [
        { role: 'user', content: 'I need a homepage for a transportation company' },
        { role: 'assistant', content: data1.reply },
    ];

    const response2 = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'Red color, Apple style, targeting multinational clients',
            history,
        }),
    });

    const data2 = await response2.json();
    console.log('GPT-4:', data2.reply);
    console.log('PRD Update:', JSON.stringify(data2.prdUpdate, null, 2));
    console.log('Tokens used:', data2.usage.totalTokens);
    console.log('\n---\n');

    // Test 3: Complete information
    console.log('Test 3: Complete information upfront');
    console.log(
        'User: "Landing page for fintech startup, targeting millennials, minimalist blue design, sans-serif typography, lead capture intent"\n'
    );

    const response3 = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message:
                'Landing page for fintech startup, targeting millennials, minimalist blue design, sans-serif typography, lead capture intent',
            history: [],
        }),
    });

    const data3 = await response3.json();
    console.log('GPT-4:', data3.reply);
    console.log('PRD Update:', JSON.stringify(data3.prdUpdate, null, 2));
    console.log('Tokens used:', data3.usage.totalTokens);
    console.log('\n---\n');

    // Calculate total cost
    const totalTokens = data1.usage.totalTokens + data2.usage.totalTokens + data3.usage.totalTokens;
    const estimatedCost = (totalTokens / 1000) * 0.02; // Rough estimate
    console.log(`📊 Total tokens used: ${totalTokens}`);
    console.log(`💰 Estimated cost: $${estimatedCost.toFixed(4)}`);
}

testChat().catch(console.error);
