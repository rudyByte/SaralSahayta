// Test script to verify upload API endpoint
// Run with: node scripts/test-upload-api.js

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
    console.log('🧪 Testing Upload API Endpoint...\n');

    // Create a test PDF file
    const testFilePath = path.join(__dirname, 'test-document.pdf');
    const testContent = Buffer.from('%PDF-1.4\n%Test PDF\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n190\n%%EOF');

    fs.writeFileSync(testFilePath, testContent);
    console.log('✅ Created test PDF file\n');

    try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(testFilePath));
        formData.append('documentCode', 'AADHAAR'); // Use a common document code

        console.log('📤 Sending request to http://localhost:3001/api/documents/upload...\n');

        const response = await fetch('http://localhost:3001/api/documents/upload', {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders(),
        });

        console.log('📥 Response Status:', response.status);
        console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log('\n📥 Response Body:');
        console.log(responseText);

        // Try to parse as JSON
        try {
            const jsonData = JSON.parse(responseText);
            console.log('\n✅ Parsed JSON Response:');
            console.log(JSON.stringify(jsonData, null, 2));
        } catch (e) {
            console.log('\n⚠️  Response is not JSON');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
    } finally {
        // Cleanup
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
            console.log('\n🧹 Cleaned up test file');
        }
    }
}

testUpload();
