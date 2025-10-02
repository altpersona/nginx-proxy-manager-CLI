const axios = require('axios');
const chalk = require('chalk');
const config = require('./config');

class ApiClient {
  constructor() {
    this.client = null;
    this.init();
  }

  init() {
    const cfg = config();
    
    this.client = axios.create({
      baseURL: cfg.getApiUrl(),
      timeout: cfg.getTimeout(),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'nginx-proxy-manager-cli/1.0.0'
      },
      validateStatus: () => true // Don't throw on HTTP errors
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        const token = cfg.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        if (cfg.isDebug()) {
          console.log(chalk.gray(`→ ${config.method.toUpperCase()} ${config.url}`));
          if (config.data) {
            console.log(chalk.gray(`→ Body: ${JSON.stringify(config.data, null, 2)}`));
          }
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
        if (cfg.isDebug()) {
          console.log(chalk.gray(`← ${response.status} ${response.config.url}`));
          if (response.data) {
            console.log(chalk.gray(`← Body: ${JSON.stringify(response.data, null, 2)}`));
          }
        }
        
        return response;
      },
      (error) => {
        if (cfg.isDebug()) {
          console.log(chalk.red(`← Error: ${error.message}`));
        }
        return Promise.reject(error);
      }
    );
  }

  async request(method, endpoint, data = null, params = null) {
    const cfg = config();
    let retries = cfg.getRetries();
    let lastError;

    while (retries > 0) {
      try {
        const response = await this.client.request({
          method,
          url: endpoint,
          data,
          params
        });

        return this.handleResponse(response);
      } catch (error) {
        lastError = error;
        retries--;
        
        if (retries > 0 && this.isRetryableError(error)) {
          if (cfg.isDebug()) {
            console.log(chalk.yellow(`Retrying request... (${retries} attempts left)`));
          }
          await this.delay(1000 * (cfg.getRetries() - retries));
          continue;
        }
        
        break;
      }
    }

    throw this.createApiError(lastError);
  }

  async handleResponse(response) {
    const { status, data } = response;

    if (status >= 200 && status < 300) {
      return data;
    }

    // Handle specific HTTP errors
    switch (status) {
      case 400:
        throw new Error(`Bad Request: ${this.extractErrorMessage(data)}`);
      case 401:
        throw new Error('Authentication failed. Please login again.');
      case 403:
        throw new Error('Access denied. Insufficient permissions.');
      case 404:
        throw new Error('Resource not found.');
      case 422:
        throw new Error(`Validation Error: ${this.extractErrorMessage(data)}`);
      case 500:
        throw new Error('Internal server error. Please try again later.');
      default:
        throw new Error(`HTTP ${status}: ${this.extractErrorMessage(data)}`);
    }
  }

  extractErrorMessage(data) {
    if (typeof data === 'string') return data;
    if (data && data.error && data.error.message) return data.error.message;
    if (data && data.message) return data.message;
    return 'Unknown error';
  }

  isRetryableError(error) {
    // Retry on network errors, timeouts, and 5xx errors
    if (!error.response) return true;
    const status = error.response.status;
    return status >= 500 || status === 429;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  createApiError(error) {
    if (error.response) {
      const { status, data } = error.response;
      const message = this.extractErrorMessage(data);
      const apiError = new Error(`API Error ${status}: ${message}`);
      apiError.status = status;
      apiError.data = data;
      return apiError;
    }
    
    return new Error(`Network Error: ${error.message}`);
  }

  // Authentication methods
  async login(email, password) {
    return this.request('POST', '/api/tokens', {
      identity: email,
      secret: password,
      scope: 'user',
      expiry: '7d'
    });
  }

  async getStatus() {
    return this.request('GET', '/api');
  }

  // Proxy Hosts methods
  async getHosts(params = {}) {
    return this.request('GET', '/api/nginx/proxy-hosts', null, params);
  }

  async getHost(id, params = {}) {
    return this.request('GET', `/api/nginx/proxy-hosts/${id}`, null, params);
  }

  async createHost(data) {
    return this.request('POST', '/api/nginx/proxy-hosts', data);
  }

  async updateHost(id, data) {
    return this.request('PUT', `/api/nginx/proxy-hosts/${id}`, data);
  }

  async deleteHost(id) {
    return this.request('DELETE', `/api/nginx/proxy-hosts/${id}`);
  }

  async enableHost(id) {
    return this.request('POST', `/api/nginx/proxy-hosts/${id}/enable`);
  }

  async disableHost(id) {
    return this.request('POST', `/api/nginx/proxy-hosts/${id}/disable`);
  }

  // Certificate methods
  async getCertificates(params = {}) {
    return this.request('GET', '/api/nginx/certificates', null, params);
  }

  async getCertificate(id, params = {}) {
    return this.request('GET', `/api/nginx/certificates/${id}`, null, params);
  }

  async createCertificate(data) {
    return this.request('POST', '/api/nginx/certificates', data);
  }

  async deleteCertificate(id) {
    return this.request('DELETE', `/api/nginx/certificates/${id}`);
  }

  async renewCertificate(id) {
    return this.request('POST', `/api/nginx/certificates/${id}/renew`);
  }

  // Access List methods
  async getAccessLists(params = {}) {
    return this.request('GET', '/api/nginx/access-lists', null, params);
  }

  async getAccessList(id, params = {}) {
    return this.request('GET', `/api/nginx/access-lists/${id}`, null, params);
  }

  async createAccessList(data) {
    return this.request('POST', '/api/nginx/access-lists', data);
  }

  async updateAccessList(id, data) {
    return this.request('PUT', `/api/nginx/access-lists/${id}`, data);
  }

  async deleteAccessList(id) {
    return this.request('DELETE', `/api/nginx/access-lists/${id}`);
  }

  // Stream methods
  async getStreams(params = {}) {
    return this.request('GET', '/api/nginx/streams', null, params);
  }

  async getStream(id, params = {}) {
    return this.request('GET', `/api/nginx/streams/${id}`, null, params);
  }

  async createStream(data) {
    return this.request('POST', '/api/nginx/streams', data);
  }

  async updateStream(id, data) {
    return this.request('PUT', `/api/nginx/streams/${id}`, data);
  }

  async deleteStream(id) {
    return this.request('DELETE', `/api/nginx/streams/${id}`);
  }

  async enableStream(id) {
    return this.request('POST', `/api/nginx/streams/${id}/enable`);
  }

  async disableStream(id) {
    return this.request('POST', `/api/nginx/streams/${id}/disable`);
  }

  // Redirection methods
  async getRedirections(params = {}) {
    return this.request('GET', '/api/nginx/redirection-hosts', null, params);
  }

  async getRedirection(id, params = {}) {
    return this.request('GET', `/api/nginx/redirection-hosts/${id}`, null, params);
  }

  async createRedirection(data) {
    return this.request('POST', '/api/nginx/redirection-hosts', data);
  }

  async updateRedirection(id, data) {
    return this.request('PUT', `/api/nginx/redirection-hosts/${id}`, data);
  }

  async deleteRedirection(id) {
    return this.request('DELETE', `/api/nginx/redirection-hosts/${id}`);
  }

  async enableRedirection(id) {
    return this.request('POST', `/api/nginx/redirection-hosts/${id}/enable`);
  }

  async disableRedirection(id) {
    return this.request('POST', `/api/nginx/redirection-hosts/${id}/disable`);
  }

  // Settings methods
  async getSettings(params = {}) {
    return this.request('GET', '/api/settings', null, params);
  }

  async getSetting(id, params = {}) {
    return this.request('GET', `/api/settings/${id}`, null, params);
  }

  async updateSetting(id, data) {
    return this.request('PUT', `/api/settings/${id}`, data);
  }
}

// Singleton pattern
let apiClient = null;

function getApiClient() {
  if (!apiClient) {
    apiClient = new ApiClient();
  }
  return apiClient;
}

module.exports = getApiClient;