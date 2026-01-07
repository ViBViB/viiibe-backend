#!/usr/bin/env python3
"""
Proxy server that serves the HTML and proxies API requests to Vercel
This solves CORS issues by making all requests from the same origin
"""
from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.request
import json

class ProxyHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/'):
            # Proxy API requests to Vercel
            vercel_url = f'https://viiibe-backend-hce5.vercel.app{self.path}'
            try:
                with urllib.request.urlopen(vercel_url) as response:
                    data = response.read()
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(data)
            except Exception as e:
                self.send_error(500, str(e))
        else:
            # Serve local files
            super().do_GET()
    
    def do_POST(self):
        if self.path.startswith('/api/'):
            # Proxy POST requests to Vercel
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            vercel_url = f'https://viiibe-backend-hce5.vercel.app{self.path}'
            req = urllib.request.Request(
                vercel_url,
                data=post_data,
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            
            try:
                with urllib.request.urlopen(req) as response:
                    data = response.read()
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(data)
            except Exception as e:
                self.send_error(500, str(e))
        else:
            self.send_error(404)
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        SimpleHTTPRequestHandler.end_headers(self)

if __name__ == '__main__':
    port = 8000
    server = HTTPServer(('localhost', port), ProxyHandler)
    print(f'\n✅ Color Curator Server Running')
    print(f'📍 Open: http://localhost:{port}/color-curator.html\n')
    server.serve_forever()
