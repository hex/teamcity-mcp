import axios, { type AxiosInstance, type AxiosError } from 'axios';
import {
  handleHttpError,
  type ErrorContext
} from '../utils/security.js';

/**
 * Secure TeamCity REST API client with comprehensive error handling
 * and sensitive data sanitization
 */
export class TeamCityClient {
  private client: AxiosInstance;
  private readonly baseUrl: string;
  private readonly isConfigured: boolean;

  constructor() {
    const serverUrl = process.env['TEAMCITY_SERVER_URL'] || '';
    const bearerToken = process.env['TEAMCITY_BEARER_TOKEN'] || '';

    // Validate configuration without exposing sensitive details
    if (!serverUrl) {
      throw new Error('TEAMCITY_SERVER_URL environment variable is required');
    }

    if (!bearerToken) {
      throw new Error('TEAMCITY_BEARER_TOKEN environment variable is required');
    }

    // Validate URL format
    try {
      const url = new URL(serverUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('TEAMCITY_SERVER_URL must use HTTP or HTTPS protocol');
      }
    } catch (error) {
      throw new Error('TEAMCITY_SERVER_URL is not a valid URL');
    }

    this.isConfigured = true;

    // Sanitize and normalize base URL
    this.baseUrl = this.normalizeBaseUrl(serverUrl);

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'TeamCity-MCP-Client/1.0.0'
      },
      timeout: 30000,
      maxRedirects: 3,
      // Prevent axios from exposing sensitive info in errors
      validateStatus: (status) => status < 600 // Accept all status codes for custom handling
    });

    // Add response interceptor for secure error handling
    this.client.interceptors.response.use(
      response => response,
      (error: AxiosError) => this.handleSecureError(error)
    );

    // Add request interceptor for logging and security
    this.client.interceptors.request.use(
      config => {
        // Log request without sensitive data
        this.logRequest(config.method?.toUpperCase() || 'UNKNOWN', config.url || '');
        return config;
      },
      error => Promise.reject(error)
    );
  }

  /**
   * Normalizes and validates the base URL
   */
  private normalizeBaseUrl(serverUrl: string): string {
    let normalized = serverUrl.trim();

    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');

    // Ensure it ends with /app/rest
    if (!normalized.endsWith('/app/rest')) {
      normalized += '/app/rest';
    }

    return normalized;
  }

  /**
   * Securely handles errors without exposing sensitive information
   */
  private handleSecureError(error: AxiosError): Promise<never> {
    const context: ErrorContext = {
      operation: 'teamcity_api_request',
      userInput: {
        method: error.config?.method,
        endpoint: this.sanitizeUrl(error.config?.url || '')
      }
    };

    // Use centralized secure error handling
    const safeError = handleHttpError(error, context);

    // Log the error securely (without sensitive details)
    this.logError(error, safeError.requestId || 'unknown');

    // Throw the error with safe message
    throw new Error(safeError.message);
  }

  /**
   * Logs request information securely
   */
  private logRequest(_method: string, _url: string): void {
    // Debug logging disabled to prevent EPIPE errors in MCP mode
    // const sanitizedUrl = this.sanitizeUrl(url);
    // console.error(`TeamCity Request: ${method} ${sanitizedUrl}`);
  }

  /**
   * Logs error information securely
   */
  private logError(_error: AxiosError, _requestId: string): void {
    // Debug logging disabled to prevent EPIPE errors in MCP mode
    // const logEntry = {
    //   requestId,
    //   method: error.config?.method?.toUpperCase(),
    //   status: error.response?.status,
    //   statusText: error.response?.statusText,
    //   timeout: error.code === 'ECONNABORTED',
    //   timestamp: new Date().toISOString()
    // };
    // console.error('TeamCity Error Log:', JSON.stringify(logEntry));
  }

  /**
   * Sanitizes URLs by removing sensitive information
   */
  private sanitizeUrl(url: string): string {
    if (!url) return '[EMPTY_URL]';

    try {
      // Remove query parameters that might contain sensitive data
      const urlObj = new URL(url, this.baseUrl);
      return `${urlObj.pathname}${urlObj.search ? '?[PARAMS_REDACTED]' : ''}`;
    } catch {
      // If URL parsing fails, just return a safe representation
      return url.split('?')[0] || '[INVALID_URL]';
    }
  }

  /**
   * Checks if the client is properly configured
   */
  public isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Performs a secure GET request with parameter validation
   */
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    this.validateEndpoint(endpoint);
    const sanitizedParams = this.sanitizeParams(params);

    const response = await this.client.get<T>(endpoint, { params: sanitizedParams });
    return this.sanitizeResponseData(response.data);
  }

  /**
   * Performs a secure POST request with data validation
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    this.validateEndpoint(endpoint);
    const sanitizedData = this.sanitizePostData(data);

    const response = await this.client.post<T>(endpoint, sanitizedData);
    return this.sanitizeResponseData(response.data);
  }

  /**
   * Performs a secure DELETE request
   */
  async delete(endpoint: string): Promise<boolean> {
    this.validateEndpoint(endpoint);
    await this.client.delete(endpoint);
    return true;
  }

  /**
   * Gets text content securely with size limits
   */
  async getText(endpoint: string): Promise<string> {
    this.validateEndpoint(endpoint);

    const response = await this.client.get(endpoint, {
      headers: { 'Accept': 'text/plain' },
      responseType: 'text',
      maxContentLength: 10 * 1024 * 1024 // 10MB limit
    });

    const text = String(response.data);
    return this.sanitizeTextContent(text);
  }

  /**
   * Gets binary content securely with size limits
   */
  async getBinary(endpoint: string): Promise<Buffer> {
    this.validateEndpoint(endpoint);

    const response = await this.client.get(endpoint, {
      responseType: 'arraybuffer',
      maxContentLength: 50 * 1024 * 1024 // 50MB limit for binary
    });

    return Buffer.from(response.data);
  }

  /**
   * Builds URLs securely with parameter sanitization
   */
  buildUrl(endpoint: string, queryParams?: Record<string, string | undefined>): string {
    this.validateEndpoint(endpoint);

    if (!queryParams || Object.keys(queryParams).length === 0) {
      return endpoint;
    }

    const sanitizedParams = this.sanitizeQueryParams(queryParams);
    const query = Object.entries(sanitizedParams)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value!)}`
      )
      .slice(0, 20) // Limit number of parameters
      .join('&');

    return query ? `${endpoint}?${query}` : endpoint;
  }

  /**
   * Builds TeamCity locator strings securely
   */
  buildLocator(parts: Record<string, string | number | boolean | undefined>): string {
    const sanitizedParts = Object.entries(parts)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => {
        // Sanitize key and value
        const safeKey = String(key).replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);
        const safeValue = String(value).replace(/[,;()[\]{}'"\\]/g, '').substring(0, 200);
        return `${safeKey}:${safeValue}`;
      })
      .slice(0, 20); // Limit number of locator parts

    return sanitizedParts.join(',');
  }

  /**
   * Validates endpoint format and security
   */
  private validateEndpoint(endpoint: string): void {
    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error('Invalid endpoint: must be a non-empty string');
    }

    if (endpoint.length > 500) {
      throw new Error('Invalid endpoint: too long');
    }

    // Split endpoint and query string for separate validation
    const [path, queryString] = endpoint.split('?');

    // Check for potentially dangerous patterns in the path
    const dangerousPathPatterns = [
      /\.\./,           // Path traversal
      /[<>'";&|`$()]/,  // Injection characters (excluding ? for query params)
      /javascript:/i,   // JavaScript protocol
      /data:/i,         // Data protocol
      /file:/i          // File protocol
    ];

    // Validate path part only (path is guaranteed to exist after split)
    if (path && dangerousPathPatterns.some(pattern => pattern.test(path))) {
      throw new Error('Invalid endpoint: contains unsafe characters in path');
    }

    // Validate query string if present
    if (queryString) {
      // Query strings can have = and & for parameters, but check for other dangerous patterns
      const dangerousQueryPatterns = [
        /[<>'"`;|$]/,     // Injection characters (allowing ? = & for valid query strings)
        /javascript:/i,   // JavaScript protocol
        /data:/i,         // Data protocol
        /file:/i          // File protocol
      ];

      if (dangerousQueryPatterns.some(pattern => pattern.test(queryString))) {
        throw new Error('Invalid endpoint: contains unsafe characters in query string');
      }
    }
  }

  /**
   * Sanitizes request parameters
   */
  private sanitizeParams(params?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!params) return undefined;

    const sanitized: Record<string, unknown> = {};
    let paramCount = 0;

    for (const [key, value] of Object.entries(params)) {
      if (paramCount >= 50) break; // Limit parameter count

      const safeKey = String(key).replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 100);
      if (safeKey && value !== undefined && value !== null) {
        sanitized[safeKey] = this.sanitizeParamValue(value);
        paramCount++;
      }
    }

    return sanitized;
  }

  /**
   * Sanitizes a parameter value
   */
  private sanitizeParamValue(value: unknown): unknown {
    if (typeof value === 'string') {
      return value.substring(0, 1000); // Limit string length
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      if (Array.isArray(value)) {
        return value.slice(0, 100).map(item => this.sanitizeParamValue(item));
      }
      const sanitized: Record<string, unknown> = {};
      let fieldCount = 0;
      for (const [key, val] of Object.entries(value)) {
        if (fieldCount >= 50) break;
        const safeKey = String(key).substring(0, 100);
        sanitized[safeKey] = this.sanitizeParamValue(val);
        fieldCount++;
      }
      return sanitized;
    }
    // For other types, convert to string and limit
    return String(value).substring(0, 1000);
  }

  /**
   * Sanitizes POST data
   */
  private sanitizePostData(data: unknown): unknown {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      return data.substring(0, 10000); // Limit POST data size
    }

    if (typeof data === 'object' && !Array.isArray(data)) {
      const sanitized: Record<string, unknown> = {};
      let fieldCount = 0;

      for (const [key, value] of Object.entries(data)) {
        if (fieldCount >= 100) break; // Limit field count

        const safeKey = String(key).substring(0, 100);
        sanitized[safeKey] = this.sanitizeParamValue(value);
        fieldCount++;
      }

      return sanitized;
    }

    return data;
  }

  /**
   * Sanitizes query parameters
   */
  private sanitizeQueryParams(params: Record<string, string | undefined>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    let paramCount = 0;

    for (const [key, value] of Object.entries(params)) {
      if (paramCount >= 20) break; // Limit parameter count

      if (value !== undefined && value !== null) {
        const safeKey = String(key).replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);
        const safeValue = String(value).substring(0, 500);

        if (safeKey && safeValue) {
          sanitized[safeKey] = safeValue;
          paramCount++;
        }
      }
    }

    return sanitized;
  }

  /**
   * Sanitizes response data to remove sensitive information
   */
  private sanitizeResponseData<T>(data: T): T {
    // For now, return data as-is since response sanitization
    // is handled in the tool-handler layer for better control
    return data;
  }

  /**
   * Sanitizes text content
   */
  private sanitizeTextContent(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Limit text size and remove potential sensitive patterns
    return text
      .substring(0, 1024 * 1024) // 1MB limit
      .replace(/Bearer\s+[a-zA-Z0-9_-]+/gi, 'Bearer [REDACTED]') // Remove bearer tokens
      .replace(/password[=:]\s*[^\s;,)]+/gi, 'password=[REDACTED]'); // Remove passwords
  }

  // High-level API methods for common operations

  async getBuild(buildId: string): Promise<any> {
    return this.get(`/builds/id:${buildId}`, {
      fields: 'id,buildTypeId,buildType(id,name,projectId,projectName),number,status,state,statusText,queuedDate,startDate,finishDate,triggered(date),webUrl,problemOccurrences(problemOccurrence(id,type,details))'
    });
  }

  async getProject(projectId: string): Promise<any> {
    return this.get(`/projects/id:${projectId}`, {
      fields: 'id,name,description,parentProject(id,name),archived,buildTypes(count),subprojects(count)'
    });
  }

  async getBuildConfig(buildTypeId: string): Promise<any> {
    return this.get(`/buildTypes/id:${buildTypeId}`, {
      fields: 'id,name,description,projectName,projectId,paused,project(id,name)'
    });
  }

  async listBuilds(params: any): Promise<any> {
    // If a raw locator is provided, use it directly
    // Otherwise build from high-level parameters
    const locator = params.locator || this.buildHighLevelLocator(params);
    return this.get('/builds', {
      locator,
      fields: params.fields || 'build(id,buildTypeId,buildType(id,projectId),number,status,state,statusText,webUrl)'
    });
  }

  async listProjects(params?: any): Promise<any> {
    const locator = params ? this.buildHighLevelLocator(params) : undefined;
    return this.get('/projects', locator ? { locator } : {});
  }

  async listBuildConfigs(params?: any): Promise<any> {
    const locator = params ? this.buildHighLevelLocator(params) : undefined;
    return this.get('/buildTypes', locator ? { locator } : {});
  }

  async listTestFailures(params: any): Promise<any> {
    const { buildId } = params;
    return this.get(`/testOccurrences`, {
      locator: `build:(id:${buildId}),status:FAILURE`
    });
  }

  async listChanges(params: any): Promise<any> {
    const { buildId, count, includeFiles } = params;
    const fields = includeFiles
      ? 'change(id,version,username,date,comment,files(file(file,changeType,relativeFile)))'
      : 'change(id,version,username,date,comment)';

    return this.get(`/changes`, {
      locator: buildId ? `build:(id:${buildId})` : undefined,
      count: count || 100,
      fields: fields
    });
  }

  async getChangeDetails(changeId: string): Promise<any> {
    return this.get(`/changes/id:${changeId}`, {
      fields: 'id,version,username,date,comment,files(file(file,changeType,relativeFile)),webUrl'
    });
  }

  async listQueuedBuilds(params?: any): Promise<any> {
    const { count, locator } = params || {};
    return this.get('/buildQueue', {
      count: count || 100,
      fields: 'build(id,buildTypeId,state,queuedDate,agent,waitReason)',
      locator: locator
    });
  }

  async cancelBuild(buildId: string, comment?: string): Promise<any> {
    // First check if build is running or queued
    try {
      const build = await this.getBuild(buildId);

      if (build.state === 'queued') {
        // Cancel queued build - use DELETE
        return this.delete(`/buildQueue/id:${buildId}`);
      } else if (build.state === 'running') {
        // Cancel running build - use POST to /builds/id:{buildId} per TeamCity docs
        try {
          const cancelUrl = `/builds/id:${buildId}`;
          const cancelData = {
            comment: comment || 'Build cancelled via MCP',
            readdIntoQueue: false
          };

          // Use POST with proper JSON body for running builds
          const response = await this.post(cancelUrl, cancelData);

          return {
            success: true,
            message: `Build ${buildId} has been cancelled`,
            build: response
          };
        } catch (cancelError: any) {
          // If cancel fails, the build might have already finished
          // Return success if build is no longer running
          const checkBuild = await this.getBuild(buildId);
          if (checkBuild.state !== 'running') {
            return {
              success: true,
              message: `Build ${buildId} is no longer running (state: ${checkBuild.state})`
            };
          }
          throw cancelError;
        }
      } else {
        return {
          success: false,
          message: `Build ${buildId} is not running or queued (state: ${build.state})`
        };
      }
    } catch (error) {
      // If build not found, try to cancel from queue anyway
      try {
        return await this.delete(`/buildQueue/id:${buildId}`);
      } catch {
        throw error; // Re-throw original error
      }
    }
  }

  async getBuildProblems(buildId: string): Promise<any> {
    return this.get('/problemOccurrences', {
      locator: `build:(id:${buildId})`,
      fields: 'problemOccurrence(id,type,identity,details,build(id))'
    });
  }

  async fetchBuildLog(params: any): Promise<any> {
    const { buildId, tail, lineCount } = params;

    try {
      // Use the direct download endpoint with the correct base URL
      // This endpoint is at the root, not under /app/rest
      const serverUrl = this.baseUrl.replace('/app/rest', '');
      const downloadUrl = `${serverUrl}/downloadBuildLog.html?buildId=${buildId}`;

      // Make a direct request to the download endpoint
      const response = await this.client.get(downloadUrl, {
        headers: { 'Accept': 'text/plain' },
        responseType: 'text',
        baseURL: '' // Override baseURL to use the full URL we constructed
      });

      const fullLog = String(response.data);

      if (tail && lineCount) {
        const lines = fullLog.split('\n');
        const tailLines = lines.slice(-lineCount);
        return {
          lines: tailLines,
          meta: {
            buildId,
            mode: 'tail',
            pageSize: lineCount,
            startLine: Math.max(0, lines.length - lineCount),
            hasMore: lines.length > lineCount,
            totalLines: lines.length
          }
        };
      }

      return {
        content: fullLog,
        buildId,
        lines: fullLog.split('\n'),
        meta: {
          buildId,
          mode: 'full',
          totalLines: fullLog.split('\n').length
        }
      };
    } catch (error: any) {
      // Fallback to REST API endpoint
      try {
        const endpoint = `/builds/id:${buildId}/logs/content`;
        const text = await this.getText(endpoint);

        if (tail && lineCount) {
          const lines = text.split('\n');
          const tailLines = lines.slice(-lineCount);
          return {
            lines: tailLines,
            meta: {
              buildId,
              mode: 'tail',
              pageSize: lineCount,
              startLine: Math.max(0, lines.length - lineCount),
              hasMore: lines.length > lineCount,
              totalLines: lines.length
            }
          };
        }

        return { content: text, buildId };
      } catch (fallbackError: any) {
        // If both endpoints fail, return an error message
        if (error.response?.status === 404 || fallbackError.response?.status === 404) {
          return {
            lines: ['Build log not available - unable to retrieve logs from server'],
            meta: {
              buildId,
              mode: 'error',
              hasMore: false,
              totalLines: 0,
              error: 'Log file not found'
            }
          };
        }
        throw error;
      }
    }
  }

  private buildHighLevelLocator(params: Record<string, any>): string {
    const parts: string[] = [];

    // Handle various locator dimensions
    if (params['projectId']) parts.push(`project:(id:${params['projectId']})`);
    if (params['buildTypeId']) parts.push(`buildType:(id:${params['buildTypeId']})`);
    if (params['status']) parts.push(`status:${params['status']}`);
    if (params['count']) parts.push(`count:${params['count']}`);
    if (params['state']) parts.push(`state:${params['state']}`);
    if (params['branchName']) parts.push(`branch:${params['branchName']}`);
    if (params['agentName']) parts.push(`agent:(name:${params['agentName']})`);
    if (params['user']) parts.push(`user:(username:${params['user']})`);
    if (params['sinceDate']) parts.push(`sinceDate:${params['sinceDate']}`);
    if (params['untilDate']) parts.push(`untilDate:${params['untilDate']}`);
    if (params['tags']) parts.push(`tags:${params['tags']}`);

    // Handle pagination
    if (params['start']) parts.push(`start:${params['start']}`);

    return parts.join(',');
  }

  // Artifact management methods

  async getBuildArtifacts(buildId: string, path?: string): Promise<any> {
    const endpoint = `/builds/id:${buildId}/artifacts${path ? `/${path}` : ''}`;
    return this.get(endpoint, {
      fields: 'file(name,size,modificationTime,href,content(href))',
      locator: 'recursive:true'
    });
  }

  async downloadArtifact(buildId: string, path: string): Promise<any> {
    const endpoint = `/builds/id:${buildId}/artifacts/content/${path}`;

    try {
      // First try to get artifact metadata to determine content type
      let contentType = 'application/octet-stream';
      let size = 0;

      try {
        const metadataEndpoint = `/builds/id:${buildId}/artifacts/metadata/${path}`;
        const metadata = await this.get<any>(metadataEndpoint);
        contentType = (metadata as any)?.contentType || contentType;
        size = (metadata as any)?.size || 0;
      } catch {
        // Metadata fetch failed, continue with download
      }

      // For large files (>10MB) or binary files, return download info instead of content
      const isLikelyBinary = !contentType.startsWith('text/') &&
                           !contentType.includes('json') &&
                           !contentType.includes('xml') &&
                           !contentType.includes('yaml') &&
                           !contentType.includes('yml');

      const isLargeFile = size > 10 * 1024 * 1024; // 10MB

      if (isLargeFile || isLikelyBinary) {
        // For large or binary files, return metadata and download URL instead of content
        return {
          type: 'download_info',
          buildId,
          path,
          contentType,
          size,
          downloadUrl: '[Use TeamCity web interface or direct API call]',
          message: 'File is too large or binary. Use TeamCity web interface to download.',
          metadata: {
            contentType,
            size: size || 'unknown',
            modificationTime: new Date().toISOString()
          }
        };
      }

      // For small text files, try to download content
      const content = await this.getText(endpoint);

      return {
        type: 'content',
        buildId,
        path,
        contentType,
        size: content.length,
        content,
        metadata: {
          contentType,
          size: content.length,
          modificationTime: new Date().toISOString()
        }
      };

    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Artifact not found: ${path} in build ${buildId}`);
      }
      throw error;
    }
  }

  async getArtifactMetadata(buildId: string, path: string): Promise<any> {
    try {
      const endpoint = `/builds/id:${buildId}/artifacts/metadata/${path}`;
      const metadata = await this.get<any>(endpoint);
      const metadataObj = metadata as any;

      return {
        buildId,
        path,
        exists: true,
        contentType: metadataObj?.contentType || 'application/octet-stream',
        size: metadataObj?.size || 0,
        modificationTime: metadataObj?.modificationTime || new Date().toISOString(),
        metadata: {
          contentType: metadataObj?.contentType || 'application/octet-stream',
          size: metadataObj?.size || 0,
          modificationTime: metadataObj?.modificationTime || new Date().toISOString(),
          downloadable: true
        }
      };

    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          buildId,
          path,
          exists: false,
          error: `Artifact not found: ${path} in build ${buildId}`,
          metadata: {
            contentType: null,
            size: 0,
            modificationTime: null,
            downloadable: false
          }
        };
      }
      throw error;
    }
  }

  /**
   * List complete project hierarchy with tree structure
   */
  async listProjectHierarchy(params: any): Promise<any> {
    const { rootProjectId } = params;
    const startProjectId = rootProjectId || '_Root';

    try {
      // Function to recursively fetch project hierarchy
      const fetchProjectRecursive = async (projectId: string): Promise<any> => {
        const project = await this.get(`/projects/id:${projectId}`, {
          fields: 'project(id,name,description,parentProjectId,archived,buildTypes(count),projects(project(id,name,description,archived,buildTypes(count))))'
        });

        const projectData = project as any;
        if (projectData.projects && projectData.projects.project) {
          // Recursively fetch child projects
          const childProjects = Array.isArray(projectData.projects.project)
            ? projectData.projects.project
            : [projectData.projects.project];

          projectData.children = await Promise.all(
            childProjects.map((child: any) => fetchProjectRecursive(child.id))
          );
        } else {
          projectData.children = [];
        }

        return project;
      };

      const hierarchy = await fetchProjectRecursive(startProjectId);

      return {
        rootProject: startProjectId,
        hierarchy,
        totalProjects: this.countProjectsInHierarchy(hierarchy),
        generatedAt: new Date().toISOString()
      };

    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Project not found: ${startProjectId}`);
      }
      throw error;
    }
  }

  /**
   * Get agents compatible with a specific build configuration
   */
  async getCompatibleAgentsForBuildType(params: any): Promise<any> {
    const { buildTypeId } = params;

    try {
      const agents = await this.get('/agents', {
        locator: `compatible:(buildType:(id:${buildTypeId}))`,
        fields: 'agent(id,name,connected,authorized,enabled,ip,pool(id,name),typeId,uptodate,currentlyRunning,compatibilityPolicy)'
      });

      const agentsData = agents as any;
      return {
        buildTypeId,
        compatibleAgents: agentsData.agent || [],
        totalCount: agentsData.count || 0,
        queryTime: new Date().toISOString()
      };

    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Build configuration not found: ${buildTypeId}`);
      }
      throw error;
    }
  }

  /**
   * List currently muted tests
   */
  async listMutedTests(params: any): Promise<any> {
    const safeInput = params || {};

    // Build locator from individual fields if custom locator not provided
    let locator: string;
    if (safeInput.locator) {
      locator = safeInput.locator;
    } else {
      const locatorParts: Record<string, string | number | boolean | undefined> = {};

      // Add project filter if provided
      if (safeInput.projectId) {
        locatorParts['affectedProject'] = `(id:${safeInput.projectId})`;
      }

      // Add pagination
      if (safeInput.count || safeInput.pageSize || safeInput.all) {
        const count = safeInput.all ? 1000 : (safeInput.count || safeInput.pageSize || 30);
        locatorParts['count'] = count;
      }

      locator = Object.entries(locatorParts)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}:${value}`)
        .join(',');
    }

    try {
      const mutes = await this.get('/mutes', {
        locator: locator || undefined,
        fields: safeInput.fields || 'mute(id,href,assignment(text,user),scope(project,buildTypes),target(tests,problems),resolution(type,comment))'
      });

      const mutesData = mutes as any;
      return {
        mutes: mutesData.mute || [],
        count: mutesData.count || 0,
        projectFilter: safeInput.projectId || null,
        queryTime: new Date().toISOString()
      };

    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Helper function to count total projects in hierarchy
   */
  private countProjectsInHierarchy(project: any): number {
    let count = 1; // Count current project
    if (project.children && Array.isArray(project.children)) {
      count += project.children.reduce((sum: number, child: any) =>
        sum + this.countProjectsInHierarchy(child), 0
      );
    }
    return count;
  }
}