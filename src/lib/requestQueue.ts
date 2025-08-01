// src/lib/requestQueue.ts

/**
 * RequestQueue - A singleton class that manages API requests to prevent rate limiting
 * 
 * This queue helps manage requests to external APIs (like Gemini) that have rate limits,
 * especially on free tiers. It ensures requests are processed one at a time,
 * implements automatic retries with exponential backoff, and provides status information.
 * 
 * @example
 * // Usage example:
 * const result = await requestQueue.enqueue(async () => {
 *   const response = await someApiCall();
 *   return response.data;
 * });
 */
export class RequestQueue {
  /** Singleton instance */
  private static instance: RequestQueue;
  
  /** Queue of pending tasks with their resolve/reject functions */
  private queue: Array<{
    task: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
  }> = [];
  
  /** Flag to prevent concurrent queue processing */
  private isProcessing = false;
  
  /** Maximum number of concurrent requests (keep at 1 for strict rate limiting) */
  private maxConcurrent = 1;
  
  /** Current number of active requests */
  private activeRequests = 0;
  
  /** Base delay between retries in milliseconds */
  private retryDelay = 1000; // 1 second
  
  /** Maximum number of retry attempts per task */
  private maxRetries = 3;

  private constructor() {}

  public static getInstance(): RequestQueue {
    if (!RequestQueue.instance) {
      RequestQueue.instance = new RequestQueue();
    }
    return RequestQueue.instance;
  }

  /**
   * Add a task to the queue and return a promise that resolves with the task result
   * 
   * @template T The return type of the task
   * @param {() => Promise<T>} task - An async function to be executed when it's this task's turn
   * @returns {Promise<T>} A promise that resolves with the result of the task or rejects with an error
   */
  public async enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Add task to the queue with its resolve/reject functions
      this.queue.push({ task, resolve, reject });
      
      // Start processing the queue if it's not already running
      this.processQueue();
    });
  }

  /**
   * Process the next tasks in the queue if there's capacity
   * 
   * This method uses setTimeout to avoid blocking the event loop and 
   * ensures tasks are processed in order while respecting concurrency limits.
   * 
   * @private
   */
  private processQueue(): void {
    // If already processing or no tasks in queue, return
    if (this.isProcessing || this.queue.length === 0) return;
    
    // Set flag to prevent multiple processQueue calls from running concurrently
    this.isProcessing = true;
    
    // Use setTimeout to move execution to the next event loop tick
    setTimeout(async () => {
      // Process tasks while there are tasks in the queue and we're under maxConcurrent
      while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
        const { task, resolve, reject } = this.queue.shift()!;
        this.activeRequests++;
        
        // Execute task with retries
        this.executeWithRetries(task, resolve, reject, 0);
      }
      
      // Reset processing flag
      this.isProcessing = false;
      
      // If there are still items in the queue and we have capacity, continue processing
      if (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
        this.processQueue();
      }
    }, 0);
  }
  
  /**
   * Execute a task with automatic retry logic and exponential backoff
   * 
   * @private
   * @param {() => Promise<any>} task - The async function to execute
   * @param {Function} resolve - Promise resolve function
   * @param {Function} reject - Promise reject function
   * @param {number} retryCount - Current retry attempt (starts at 0)
   */
  private async executeWithRetries(
    task: () => Promise<any>,
    resolve: (value: any) => void,
    reject: (reason?: any) => void,
    retryCount: number
  ): Promise<void> {
    try {
      // Execute the task
      const result = await task();
      
      // If successful, resolve with result
      resolve(result);
      
      // Task completed successfully, decrement active requests
      this.activeRequests--;
      this.processQueue();
    } catch (error) {
      // If we haven't exceeded retry attempts and it's a retryable error
      if (retryCount < this.maxRetries && this.isRetryableError(error)) {
        console.log(`Retrying task, attempt ${retryCount + 1} of ${this.maxRetries}...`);
        
        // Calculate backoff delay with exponential increase
        const backoffDelay = this.retryDelay * Math.pow(2, retryCount);
        
        // Wait before retrying
        setTimeout(() => {
          this.executeWithRetries(task, resolve, reject, retryCount + 1);
        }, backoffDelay);
      } else {
        // If we've exhausted retries or error isn't retryable, reject
        reject(error);
        
        // Task failed permanently, decrement active requests
        this.activeRequests--;
        this.processQueue();
      }
    }
  }
  
  /**
   * Determine if an error should trigger a retry attempt
   * 
   * Checks for common rate limit error patterns in the error message
   * and HTTP status codes that indicate temporary issues.
   * 
   * @private
   * @param {any} error - The error object to examine
   * @returns {boolean} True if the error should trigger a retry, false otherwise
   */
  private isRetryableError(error: any): boolean {
    // Check for rate limit error messages in error.message
    if (error && typeof error.message === 'string') {
      const rateLimitPatterns = [
        /rate limit/i,
        /too many requests/i,
        /quota exceeded/i,
        /resource exhausted/i,
        /try again later/i,
        /service unavailable/i,
      ];
      
      for (const pattern of rateLimitPatterns) {
        if (pattern.test(error.message)) {
          return true;
        }
      }
    }
    
    // Check for specific HTTP status codes that indicate temporary issues
    if (error && error.status) {
      // 408: Request Timeout
      // 429: Too Many Requests
      // 500: Internal Server Error
      // 502: Bad Gateway
      // 503: Service Unavailable
      // 504: Gateway Timeout
      const retryStatusCodes = [408, 429, 500, 502, 503, 504];
      if (retryStatusCodes.includes(error.status)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get the current number of tasks waiting in the queue
   * 
   * Useful for checking queue status and implementing backpressure
   * when queue size exceeds a threshold.
   * 
   * @returns {number} The number of pending tasks in the queue
   */
  public get queueLength(): number {
    return this.queue.length;
  }

  /**
   * Get the current number of active requests being processed
   * 
   * Useful for monitoring and debugging the queue's activity.
   * 
   * @returns {number} The number of currently executing tasks
   */
  public get currentlyProcessing(): number {
    return this.activeRequests;
  }
}

/**
 * Export a singleton instance of the RequestQueue
 * This ensures there's only one queue managing all API requests across the application
 */
export default RequestQueue.getInstance();
