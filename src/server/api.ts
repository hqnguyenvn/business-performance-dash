
import { createServer } from 'http';
import { URL } from 'url';
import { handleCreateUser } from '../api/userManagement';

const server = createServer(async (req, res) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (url.pathname === '/api/create-user') {
    const request = new Request(`http://${req.headers.host}${req.url}`, {
      method: req.method,
      headers: req.headers as any,
      body: req.method === 'POST' ? await getRequestBody(req) : undefined,
    });
    
    const response = await handleCreateUser(request);
    const body = await response.text();
    
    res.writeHead(response.status, {
      'Content-Type': response.headers.get('Content-Type') || 'text/plain'
    });
    res.end(body);
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

function getRequestBody(req: any): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
  });
}

const PORT = process.env.API_PORT || 3001;
server.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
