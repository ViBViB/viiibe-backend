/**
 * Color Curator Page
 * Serves the color curation interface
 */

export default function handler(req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Color Curator - Viiibe</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #e0e0e0;
            overflow: hidden;
        }

        .container {
            display: grid;
            grid-template-columns: 1fr 450px;
            height: 100vh;
        }

        .image-panel {
            display: flex;
            align-items: center;
            justify-content: center;
            background: #000;
            position: relative;
        }

        .pin-image {
            max-width: 90%;
            max-height: 90vh;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .controls-panel {
            background: #1a1a1a;
            padding: 40px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
        }

        .header {
            margin-bottom: 30px;
        }

        h1 {
            font-size: 28px;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .progress {
            font-size: 14px;
            color: #888;
            margin-bottom: 20px;
        }

        .progress-bar {
            width: 100%;
            height: 6px;
            background: #333;
            border-radius: 3px;
            overflow: hidden;
            margin-top: 8px;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            transition: width 0.3s;
        }

        .info-section {
            background: #0a0a0a;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 24px;
        }

        .info-row {
            margin-bottom: 16px;
        }

        .info-row:last-child {
            margin-bottom: 0;
        }

        .info-label {
            font-size: 12px;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }

        .current-color {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 6px;
            background: rgba(102, 126, 234, 0.2);
            color: #667eea;
            font-weight: 600;
            font-size: 16px;
        }

        .current-tags {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }

        .tag {
            padding: 6px 12px;
            border-radius: 4px;
            background: #333;
            color: #e0e0e0;
            font-size: 13px;
        }

        .pin-title {
            color: #e0e0e0;
            font-size: 14px;
            line-height: 1.5;
        }

        .section-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #e0e0e0;
        }

        .color-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 24px;
        }

        .color-btn {
            padding: 16px;
            border: 2px solid #333;
            border-radius: 8px;
            background: #0a0a0a;
            color: #e0e0e0;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .color-btn:hover {
            border-color: #667eea;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }

        .color-btn:active {
            transform: translateY(0);
        }

        .color-dot {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.2);
            flex-shrink: 0;
        }

        .btn-next {
            width: 100%;
            padding: 16px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            background: #333;
            color: #e0e0e0;
            margin-top: auto;
        }

        .btn-next:hover {
            background: #444;
        }

        .status {
            margin-top: 16px;
            padding: 12px;
            border-radius: 6px;
            font-size: 13px;
            text-align: center;
            display: none;
        }

        .status.show {
            display: block;
        }

        .status.success {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .status.error {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-size: 18px;
            color: #888;
        }
    </style>
</head>
<body>
    <div id="loading" class="loading">
        Loading pins...
    </div>

    <div id="app" class="container" style="display: none;">
        <div class="image-panel">
            <img id="pinImage" class="pin-image" alt="Pin">
        </div>

        <div class="controls-panel">
            <div class="header">
                <h1>🎨 Color Curator</h1>
                <div class="progress">
                    <span id="progressText">0 / 0</span>
                    <div class="progress-bar">
                        <div id="progressFill" class="progress-fill" style="width: 0%"></div>
                    </div>
                </div>
            </div>

            <div class="info-section">
                <div class="info-row">
                    <div class="info-label">Current Primary Color</div>
                    <div id="currentColor" class="current-color">-</div>
                </div>
                
                <div class="info-row">
                    <div class="info-label">All Color Tags</div>
                    <div id="currentTags" class="current-tags">
                        <span class="tag">-</span>
                    </div>
                </div>

                <div class="info-row">
                    <div class="info-label">Title</div>
                    <div id="pinTitle" class="pin-title">-</div>
                </div>
            </div>

            <div class="section-title">Select New Color</div>
            <div class="color-grid" id="colorGrid"></div>

            <button class="btn-next" onclick="nextPin()">Next Pin →</button>

            <div id="status" class="status"></div>
        </div>
    </div>

    <script>
        const API_BASE = '/api';
        
        const COLORS = [
            { name: 'red', hex: '#ef4444' },
            { name: 'pink', hex: '#ec4899' },
            { name: 'orange', hex: '#f97316' },
            { name: 'yellow', hex: '#eab308' },
            { name: 'green', hex: '#22c55e' },
            { name: 'blue', hex: '#3b82f6' },
            { name: 'purple', hex: '#a855f7' },
            { name: 'brown', hex: '#92400e' },
            { name: 'black', hex: '#000000' },
            { name: 'white', hex: '#ffffff' },
            { name: 'gray', hex: '#6b7280' },
            { name: 'beige', hex: '#d4a574' }
        ];

        let pins = [];
        let currentIndex = 0;

        async function init() {
            try {
                const response = await fetch(API_BASE + '/get-pins');
                const data = await response.json();
                pins = data.pins || [];

                if (pins.length === 0) {
                    showStatus('No pins found', 'error');
                    return;
                }

                renderColorButtons();
                loadPin(0);

                document.getElementById('loading').style.display = 'none';
                document.getElementById('app').style.display = 'grid';

            } catch (error) {
                showStatus('Error loading pins: ' + error.message, 'error');
                document.getElementById('loading').textContent = 'Error: ' + error.message;
            }
        }

        function renderColorButtons() {
            const grid = document.getElementById('colorGrid');
            grid.innerHTML = COLORS.map(color => 
                '<button class="color-btn" onclick="selectColor(\\'' + color.name + '\\')">' +
                    '<div class="color-dot" style="background: ' + color.hex + '; ' + (color.name === 'white' ? 'border-color: #333;' : '') + '"></div>' +
                    '<span>' + color.name.charAt(0).toUpperCase() + color.name.slice(1) + '</span>' +
                '</button>'
            ).join('');
        }

        function loadPin(index) {
            if (index >= pins.length) {
                showStatus('All pins reviewed!', 'success');
                return;
            }

            currentIndex = index;
            const pin = pins[index];

            document.getElementById('pinImage').src = pin.imageUrl;
            document.getElementById('currentColor').textContent = pin.aiAnalysis?.color?.[0] || 'none';
            
            const allColors = pin.aiAnalysis?.color || [];
            const tagsHtml = allColors.length > 0 
                ? allColors.map(c => '<span class="tag">' + c + '</span>').join('')
                : '<span class="tag">none</span>';
            document.getElementById('currentTags').innerHTML = tagsHtml;
            
            document.getElementById('pinTitle').textContent = pin.title || 'Untitled';
            document.getElementById('progressText').textContent = (index + 1) + ' / ' + pins.length;
            document.getElementById('progressFill').style.width = (((index + 1) / pins.length) * 100) + '%';
        }

        async function selectColor(colorName) {
            const pin = pins[currentIndex];

            try {
                const response = await fetch(API_BASE + '/update-pin-color', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pinId: pin.id || pin.pinId,
                        color: colorName
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to update pin');
                }

                showStatus('✅ Saved as ' + colorName, 'success');
                
                setTimeout(function() {
                    loadPin(currentIndex + 1);
                }, 500);

            } catch (error) {
                showStatus('❌ Error: ' + error.message, 'error');
            }
        }

        function nextPin() {
            loadPin(currentIndex + 1);
        }

        function showStatus(message, type) {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = 'status show ' + type;
            
            if (type === 'success') {
                setTimeout(function() {
                    status.classList.remove('show');
                }, 2000);
            }
        }

        init();
    </script>
</body>
</html>`);
}
