const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
    console.log('🧪 Testing Download Markup API Endpoints...\n');

    try {
        // Test 1: Get favorite folders
        console.log('1. Testing GET /api/folders/favorites...');
        const favoritesResponse = await fetch(`${BASE_URL}/api/folders/favorites`);
        const favoritesData = await favoritesResponse.json();
        console.log('✅ Favorites response:', favoritesData);

        // Test 2: Browse directories
        console.log('\n2. Testing GET /api/folders/browse...');
        const browseResponse = await fetch(`${BASE_URL}/api/folders/browse`);
        const browseData = await browseResponse.json();
        console.log('✅ Browse response:', browseData);

        // Test 3: Add a test favorite folder
        console.log('\n3. Testing POST /api/folders/favorites...');
        const addResponse = await fetch(`${BASE_URL}/api/folders/favorites`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                folderPath: process.env.USERPROFILE + '/Documents'
            })
        });
        const addData = await addResponse.json();
        console.log('✅ Add favorite response:', addData);

        // Test 4: Save a test markdown file
        console.log('\n4. Testing POST /api/download/save...');
        const saveResponse = await fetch(`${BASE_URL}/api/download/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: '# Test Markdown\n\nThis is a test file.',
                filename: 'test-file.md',
                folderPath: process.env.USERPROFILE + '/Documents'
            })
        });
        const saveData = await saveResponse.json();
        console.log('✅ Save response:', saveData);

        // Test 5: Remove the test favorite folder
        console.log('\n5. Testing DELETE /api/folders/favorites...');
        const removeResponse = await fetch(`${BASE_URL}/api/folders/favorites`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                folderPath: process.env.USERPROFILE + '/Documents'
            })
        });
        const removeData = await removeResponse.json();
        console.log('✅ Remove favorite response:', removeData);

        console.log('\n🎉 All API tests completed successfully!');

    } catch (error) {
        console.error('❌ API test failed:', error.message);
    }
}

testAPI(); 