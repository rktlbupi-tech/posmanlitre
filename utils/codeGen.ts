import { ApiRequest } from '../types';

export const generateCurl = (req: ApiRequest): string => {
  let cmd = `curl -X ${req.method} "${req.url}"`;

  // Headers
  req.headers.forEach(h => {
    if (h.enabled && h.key) cmd += ` \\\n  -H "${h.key}: ${h.value}"`;
  });

  // Auth
  if (req.auth.type === 'bearer' && req.auth.token) {
    cmd += ` \\\n  -H "Authorization: Bearer ${req.auth.token}"`;
  } else if (req.auth.type === 'basic') {
    const creds = btoa(`${req.auth.username}:${req.auth.password}`);
    cmd += ` \\\n  -H "Authorization: Basic ${creds}"`;
  }

  // Body
  if (req.body.type === 'json' && req.body.raw) {
    cmd += ` \\\n  -H "Content-Type: application/json"`;
    // Escape quotes for shell
    const escapedBody = req.body.raw.replace(/"/g, '\\"');
    cmd += ` \\\n  -d "${escapedBody}"`;
  }

  return cmd;
};

export const generateFetch = (req: ApiRequest): string => {
  const options: any = {
    method: req.method,
    headers: {},
  };

  req.headers.forEach(h => {
    if(h.enabled && h.key) options.headers[h.key] = h.value;
  });

  if (req.auth.type === 'bearer' && req.auth.token) {
    options.headers['Authorization'] = `Bearer ${req.auth.token}`;
  } else if (req.auth.type === 'basic') {
    options.headers['Authorization'] = `Basic ` + '${btoa("' + req.auth.username + ':' + req.auth.password + '")}';
  }

  let bodyStr = '';
  if (req.body.type === 'json' && req.body.raw) {
    options.headers['Content-Type'] = 'application/json';
    bodyStr = `\n  body: JSON.stringify(${req.body.raw}),`;
  }

  return `fetch("${req.url}", {
  method: "${req.method}",
  headers: ${JSON.stringify(options.headers, null, 2)},${bodyStr}
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error(error));`;
};