const axios = require('axios');
const chalk = require('chalk');
const { getConfig } = require('./config');

class NginxProxyManagerAPI {
  constructor(baseURL = null, token = null) {
    this.baseURL = baseURL;
    this.token = token;
    this.client = null;
    this.init();
  }

  init() {
    const config = getConfig();
    this.baseURL = this.baseURL || config.url || process.env.NPM_URL || 'http://localhost:81';
    this.token = this.token || config.token || process.env.NPM_TOKEN;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'nginx-proxy-manager-cli/1.0.0'
      }
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response) {
          const { status, data } = error.response;
          let message = 'API Error';

          if (data && data.error) {
            message = data.error.message || data.error;
          } else if (data && data.message) {
            message = data.message;
          } else if (status === 401) {
            message = 'Authentication failed - invalid token';
          } else if (status === 403) {
            message = 'Access forbidden - insufficient permissions';
          } else if (status === 404) {
            message = 'Resource not found';
          } else if (status >= 500) {
            message = 'Server error - please check Nginx Proxy Manager logs';
          }

          error.message = message;
        } else if (error.request) {
          error.message = 'Unable to connect to Nginx Proxy Manager - please check the URL and ensure the service is running';
        }

        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  async login(email, password) {
    try {
      const response = await this.client.post('/api/tokens', {
        identity: email,
        secret: password
      });
      
      this.token = response.data.token;
      return response.data;
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async verifyToken() {
    try {
      const response = await this.client.get('/api/tokens/verify');
      return response.data;
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  // Proxy Hosts methods
  async getProxyHosts() {
    try {
      const response = await this.client.get('/api/nginx/proxy-hosts');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get proxy hosts: ${error.message}`);
    }
  }

  async getProxyHost(id) {
    try {
      const response = await this.client.get(`/api/nginx/proxy-hosts/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get proxy host: ${error.message}`);
    }
  }

  async createProxyHost(data) {
    try {
      const response = await this.client.post('/api/nginx/proxy-hosts', data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create proxy host: ${error.message}`);
    }
  }

  async updateProxyHost(id, data) {
    try {
      const response = await this.client.put(`/api/nginx/proxy-hosts/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update proxy host: ${error.message}`);
    }
  }

  async deleteProxyHost(id) {
    try {
      const response = await this.client.delete(`/api/nginx/proxy-hosts/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete proxy host: ${error.message}`);
    }
  }

  // Certificates methods
  async getCertificates() {
    try {
      const response = await this.client.get('/api/nginx/certificates');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get certificates: ${error.message}`);
    }
  }

  async getCertificate(id) {
    try {
      const response = await this.client.get(`/api/nginx/certificates/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get certificate: ${error.message}`);
    }
  }

  async createCertificate(data) {
    try {
      const response = await this.client.post('/api/nginx/certificates', data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create certificate: ${error.message}`);
    }
  }

  async deleteCertificate(id) {
    try {
      const response = await this.client.delete(`/api/nginx/certificates/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete certificate: ${error.message}`);
    }
  }

  async renewCertificate(id) {
    try {
      const response = await this.client.post(`/api/nginx/certificates/${id}/renew`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to renew certificate: ${error.message}`);
    }
  }

  // Access Lists methods
  async getAccessLists() {
    try {
      const response = await this.client.get('/api/nginx/access-lists');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get access lists: ${error.message}`);
    }
  }

  async getAccessList(id) {
    try {
      const response = await this.client.get(`/api/nginx/access-lists/${id}`);
      return response.data;
    } catch ( error) {
      throw new Error(`Failed to get access list: ${error.message}`);
    }
  }

  async createAccessList(data) {
    try {
      const response = await this.client.post('/api/nginx/access-lists', data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create access list: ${error.message}`);
    }
  }

  async updateAccessList(id, data) {
    try {
      const response = await this.client.put(`/api/nginx/access-lists/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update access list: ${error.message}`);
    }
  }

  async deleteAccessList(id) {
    try {
      const response = await this.client.delete(`/api/nginx/access-lists/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete access list: ${error.message}`);
    }
  }

  // Streams methods
  async getStreams() {
    try {
      const response = await this.client.get('/api/nginx/streams');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get streams: ${error.message}`);
    }
  }

  async getStream(id) {
    try {
      const response = await this.client.get(`/api/nginx/streams/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get stream: ${error.message}`);
    }
  }

  async createStream(data) {
    try {
      const response = await this.client.post('/api/nginx/streams', data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create stream: ${error.message}`);
    }
  }

  async updateStream(id, data) {
    try {
      const response = await this.client.put(`/api/nginx/streams/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update stream: ${error.message}`);
    }
  }

  async deleteStream(id) {
    try {
      const response = await this.client.delete(`/api/nginx/streams/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete stream: ${error.message}`);
    }
  }

  // Redirection Hosts methods
  async getRedirectionHosts() {
    try {
      const response = await this.client.get('/api/nginx/redirection-hosts');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get redirection hosts: ${error.message}`);
    }
  }

  async getRedirectionHost(id) {
    try {
      const response = await this.client.get(`/api/nginx/redirection-hosts/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get redirection host: ${error.message}`);
    }
  }

  async createRedirectionHost(data) {
    try {
      const response = await this.client.post('/api/nginx/redirection-hosts', data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create redirection host: ${error.message}`);
    }
  }

  async updateRedirectionHost(id, data) {
    try {
      const response = await this.client.put(`/api/nginx/redirection-hosts/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update redirection host: ${error.message}`);
    }
  }

  async deleteRedirectionHost(id) {
    try {
      const response = await this.client.delete(`/api/nginx/redirection-hosts/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete redirection host: ${error.message}`);
    }
  }

  // Settings methods
  async getSettings() {
    try {
      const response = await this.client.get('/api/settings');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get settings: ${error.message}`);
    }
  }

  async updateSettings(data) {
    try {
      const response = await this.client.put('/api/settings', data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update settings: ${error.message}`);
    }
  }

  // System methods
  async getSystemStatus() {
    try {
      const response = await this.client.get('/api/system/status');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get system status: ${error.message}`);
    }
  }

  async getSystemVersion() {
    try {
      const response = await this.client.get('/api/system/version');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get system version: ${error.message}`);
    }
  }
}

module.exports = NginxProxyManagerAPI;