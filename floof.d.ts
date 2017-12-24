declare module 'floof' {
  import { IncomingMessage } from 'http';
  
  /**
   * An object that's been typecasted via a body parser or type adapter.
   * May or may not be a promise.
   */
  type Adapted = Promise<any> | any;
  
  /**
   * A function that consumes an IncomingMessage, parses the message body, and produces the result.
   * May or may not be async.
   */
  type BodyParser = (req: IncomingMessage) => Adapted;
  
  /**
   * A function that consumes a string, parses is at some type, and produces the result.
   * May or may not be async.
   */
  type TypeAdapter = (s: string) => Adapted;
  
  /**
   * An object mapping arbitrary string keys to arbitrary values for use in rendering a template.
   */
  type RenderContext = {[key: string]: any};
  
  /**
   * A short string identifier for a body parser type.
   */
  type ParserType = 'json' | 'str' | 'buf' | 'form' | string;
  
  /**
   * A short string identifier for a type adapter type.
   */
  type AdapterType = 'str' | 'int' | 'float' | 'bool' | string;
  
  /**
   * An HTTP verb (or method or action or whatever you want to call it).
   */
  type HttpVerb = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  
  /**
   * A string of the format "/foo/bar", where the forwards slashes delimit a path from the root of a web service.
   * You can also include parameters using colon-prefixed path elements, as in "/foo/bar/:param".
   * Furthermore, you can define types for each parameter, as in "foo/bar/:param|int". They'll be automatically parsed and a 400 will be thrown if an invalid request is made.
   */
  type EndpointPath = string;
  
  /**
   * A response to a request.
   * Preferrably a Stoof or a string, but floof will try to convert any other type to an acceptable one.
   */
  type FloofResponse = Stoof | string | any;
  
  /**
   * A valid HTTP status code for a redirect.
   */
  type RedirectCode = 301 | 302 | 303 | 305 | 307;
  
  /**
   * A plugin that defines additional behaviour for a floofball.
   */
  interface FloofPlugin {
    /**
     * Called upon plugin registration.
     * This is where you should register handlers to extend the floofball's behaviour.
     */
    init(floofball: FloofBall): void;
  }
  
  /**
   * A floof application. This is where the magic happens.
   */
  export class Floof {
    /**
     * Creates a Floof instance.
     */
    constructor();
    
    /**
     * This Floof instance's template rendering engine.
     */
    public renderer: FloofRenderer;
    
    /**
     * Registers a new body parser.
     * @param type The new parser's type.
     * @param parser The parser function.
     * @returns This Floof instance, for the sake of chaining.
     */
    public parser(type: ParserType, parser: BodyParser): Floof;
    
    /**
     * Registers a new type adapter.
     * @param type The new adapter's type.
     * @param adapter The type adapting function.
     * @returns This Floof instance, for the sake of chaining.
     */
    public adapter(type: AdapterType, adapter: TypeAdapter): Floof;
    
    /**
     * Registers a new global before-handler which gets run before any endpoint handler.
     * @returns The newly-created before-handler.
     */
    public before(): GlobalBeforeHandler;
    
    /**
     * Registers a new global afater-handler which gets run after endpoint handlers.
     * @returns The newly-created after-handler.
     */
    public after(): GlobalAfterHandler;
    
    /**
     * Registers a new global error handler which gets run if an error is encountered outside a floofball.
     * @returns The newly-created error handler.
     */
    public error(): ErrorHandler;
    
    /**
     * Registers a new floofball to provide endpoints.
     * @param floofball The floofball to be registered.
     * @returns This Floof instance, for the sake of chaining.
     */
    public ball(floofball: FloofBall): Floof;
    
    /**
     * Starts the floof server.
     * @param host The host to listen on. Defaults to '0.0.0.0'.
     * @param port The port to listen on. Defaults to 8080.
     * @returns A promise that resolves when the server is finished initializing.
     */
    public go(host?: string, port?: number): Promise<void>;
  }
  
  /**
   * A floof module. Provides endpoints and other associated request handlers for a floof server.
   */
  export class FloofBall {
    /**
     * Creates a new floofball (i.e. floof module).
     */
    constructor();
    
    /**
     * Sets a default body parser for all requests this floofball receives.
     * @param type Body parser type.
     * @returns This FloofBall, for the sake of chaining.
     */
    public adaptBody(type: ParserType): FloofBall;
    
    /**
     * Sets a default rendering context for all requests this floofball receives.
     * @param context The rendering context.
     * @returns This FloofBall, for the sake of chaining.
     */
    public context(context: RenderContext): FloofBall;
    
    /**
     * Registers a plugin.
     * @param plugin The plugin to be registered.
     * @returns This FloofBall, for the sake of chaining.
     */
    public plugin(plugin: FloofPlugin): FloofBall;
    
    /**
     * Registers a new before-handler which gets run before any endpoint handler.
     * @returns The newly-created before-handler.
     */
    public before(): BeforeHandler;
      
    /**
     * Registers a new after-handler which gets run after endpoint handlers.
     * @returns The newly-created after-handler.
     */
    public after(): AfterHandler;
    
    /**
     * Registers a new error handler that gets run to handle erroneous HTTP status codes.
     * @returns The newly-created error handler.
     */
    public error(): ErrorHandler;
    
    /**
     * Registers a new endpoint handler for the given method and path.
     * @param method The HTTP verb this handler should handle.
     * @param path The path this handler should handle requests to.
     * @returns The newly-created endpoint handler.
     */
    public endpoint(method: HttpVerb, path: EndpointPath): EndpointHandler;
    
    /**
     * Registers a new endpoint handler for the HTTP verb GET.
     * @param path The path this handler should handle requests to.
     * @returns The newly-created endpoint handler.
     */
    public get(path: EndpointPath): EndpointHandler;
    
    /**
     * Registers a new endpoint handler for the HTTP verb HEAD.
     * @param path The path this handler should handle requests to.
     * @returns The newly-created endpoint handler.
     */
    public head(path: EndpointPath): EndpointHandler;
    
    /**
     * Registers a new endpoint handler for the HTTP verb POST.
     * @param path The path this handler should handle requests to.
     * @returns The newly-created endpoint handler.
     */
    public post(path: EndpointPath): EndpointHandler;
    
    /**
     * Registers a new endpoint handler for the HTTP verb PUT.
     * @param path The path this handler should handle requests to.
     * @returns The newly-created endpoint handler.
     */
    public put(path: EndpointPath): EndpointHandler;
    
    /**
     * Registers a new endpoint handler for the HTTP verb PATCH.
     * @param path The path this handler should handle requests to.
     * @returns The newly-created endpoint handler.
     */
    public patch(path: EndpointPath): EndpointHandler;
    
    /**
     * Registers a new endpoint handler for the HTTP verb DELETE.
     * @param path The path this handler should handle requests to.
     * @returns The newly-created endpoint handler.
     */
    public delete(path: EndpointPath): EndpointHandler;
  }
  
  /**
   * The parent type of before- and after-handlers.
   */
  export class AroundHandler {
    /**
     * Sets a filter on this handler. If the predicate fails, all executors registered after this filter won't run.
     * @param filter The predicate to filter by.
     * @returns This handler, for the sake of chaining.
     */
    public when(filter: (...args: any[]) => boolean): AroundHandler;
    
    /**
     * Sets an executor on this handler. Executors run in order of registration.
     * @param func The executor function to execute.
     * @returns This handler, for the sake of chaining.
     */
    public exec(func: (...args: any[]) => void): AroundHandler;
  }
  
  /**
   * Executed before endpoint handlers but after global before-handlers; second to be executed.
   */
  export class BeforeHandler extends AroundHandler {
    /**
     * Sets a filter on this handler. If the predicate fails, all executors registered after this filter won't run.
     * @param filter A predicate that accepts a FloofRequest.
     * @returns This handler, for the sake of chaining.
     */
    public when(filter: (req: FloofRequest) => boolean): BeforeHandler;
    
    /**
     * Sets an executor on this handler. Executors run in order of registration.
     * @param func An executor that accepts a FloofRequest.
     * @returns This handler, for the sake of chaining.
     */
    public exec(func: (req: FloofRequest) => void): BeforeHandler;
  }
  
  /**
   * Executed after endpoint handlers but before global after-handlers; fourth to be executed.
   */
  export class AfterHandler extends AroundHandler {
    /**
     * Sets a filter on this handler. If the predicate fails, all executors registered after this filter won't run.
     * @param filter A predicate that accepts a FloofRequest and a Stoof.
     * @returns This handler, for the sake of chaining.
     */
    public when(filter: (req: FloofRequest, res: Stoof) => boolean): AfterHandler;
    
    /**
     * Sets an executor on this handler. Executors run in order of registration.
     * @param func An executor that accepts a FloofRequest and a Stoof.
     * @returns This handler, for the sake of chaining.
     */
    public exec(func: (req: FloofRequest, res: Stoof) => void): AfterHandler;
  }
  
  /**
   * Executed before all other handlers; first to be executed.
   */
  export class GlobalBeforeHandler extends AroundHandler {
    /**
     * Sets a filter on this handler. If the predicate fails, all executors registered after this filter won't run.
     * @param filter A predicate that accepts an IncomingMessage and a Map<string, string> of query parameters.
     * @returns This handler, for the sake of chaining.
     */
    public when(filter: (req: IncomingMessage, params: Map<string, string>) => boolean): GlobalBeforeHandler;
    
    /**
     * Sets an executor on this handler. Executors run in order of registration.
     * @param func An executor that accepts an IncomingMessage and a Map<string, string> of query parameters.
     * @returns This handler, for the sake of chaining.
     */
    public exec(func: (req: IncomingMessage, params: Map<string, string>) => void): GlobalBeforeHandler;
  }
  
  /**
   * Executed after all other handlers; fifth to be executed.
   */
  export class GlobalAfterHandler extends AroundHandler {
    /**
     * Sets a filter on this handler. If the predicate fails, all executors registered after this filter won't run.
     * @param filter A predicate that accepts an IncomingMessage, a Stoof, and a Map<string, string> of query parameters.
     * @returns This handler, for the sake of chaining.
     */
    public when(filter: (req: IncomingMessage, res: Stoof, params: Map<string, string>) => boolean): GlobalAfterHandler;
    
    /**
     * Sets an executor on this handler. Executors run in order of registration.
     * @param func An executor that accepts an IncomingMessage, a Stoof, and a Map<string, string> of query parameters.
     * @returns This handler, for the sake of chaining.
     */
    public exec(func: (req: IncomingMessage, res: Stoof, params: Map<string, string>) => void): GlobalAfterHandler;
  }
  
  /**
   * Defines a contract for ErrorHandler and GlobalErrorHandler.
   */
  class ErrorHandlerBase {
    /**
     * Sets specific HTTP status codes to run this handler for.
     * @param code The HTTP status codes to handle.
     * @returns This ErrorHandler, for the sake of chaining.
     */
    public forCode(...code: number[]): ErrorHandler;
    
    /**
     * Sets a range of HTTP status codes to run this handler for.
     * @param startIncl The beginning of the range, inclusive.
     * @param endExcl The end of the range, exclusive.
     * @returns This ErrorHandler, for the sake of chaining.
     */
    public forCodes(startIncl: number, endExcl: number): ErrorHandler;
  }
  
  /**
   * Handles erroneous HTTP status codes. You might, for example, use this to display a custom 404 page.
   */
  export class ErrorHandler extends ErrorHandlerBase {
    /**
     * Sets an executor on this handler for the specified HTTP status codes or code ranges.
     * If no specific codes or code ranges are specified, this handler will handle all status codes.
     * @param func The executor function, which accepts the status code, the status message, and a ContextualizedRenderer.
     */
    public exec(func: (req: IncomingMessage, msg: string, ren: ContextualizedRenderer) => void): void;
  }
  
  /**
   * Handles erroneous HTTP status codes at a global level (i.e. not associated with a floofball).
   * Used when an error is thrown outside the context of a floofball.
   */
  export class GlobalErrorHandler extends ErrorHandlerBase {
    /**
     * Sets an executor on this handler for the specified HTTP status codes or code ranges.
     * If no specific codes or code ranges are specified, this handler will handle all status codes.
     * @param func The executor function, which accepts the status code, the status message, and the FloofRenderer.
     */
    public exec(func: (req: IncomingMessage, msg: string, ren: FloofRenderer) => void): void;
  }
  
  /**
   * Handles requests to an endpoint. Third to be executed -- after before-handlers but before after-handlers.
   */
  export class EndpointHandler {
    /**
     * Registers a query parameter to be parsed on incoming requests.
     * Throws a 400 if a request with an invalid value is encountered.
     * @param key The parameter's key.
     * @param type The type to automatically adapt query parameters to.
     * @param req Whether this parameter is required or not.
     * @returns This EndpointHandler, for the sake of chaining.
     */
    public withQuery(key: string, type?: AdapterType, req?: boolean): EndpointHandler;
    
    /**
     * Registers a body parsing type. Falls back to the floofball default if not defined.
     * @param type The type to parse request bodies as.
     * @return This EndpointHandler, for the sake of chaining.
     */
    public withBody(type: ParserType): EndpointHandler;
    
    /**
     * Sets an executor on this handler.
     * @param func An executor that accepts a FloofRequest and a ContextualizedRenderer and produces a response.
     */
    public exec(func: (req: FloofRequest, ren: ContextualizedRenderer) => FloofResponse): void;
  }
  
  /**
   * A template rendering engine.
   */
  export class FloofRenderer {
    /**
     * Renders a template file to HTML with the given rendering context.
     * @param file The template file to render. Should be located in /templates.
     * @param context The context to render the template file with.
     * @returns A promise that resolves when the rendering is complete.
     */
    public render(file: string, context: RenderContext): Promise<string>;
    
    /**
     * Clears the template cache and recompiles template files.
     * Templates are compiled and cached on startup.
     */
    public recompile(): void;
  }
  
  /**
   * A template rendering engine contextualized to a specific floofball and request.
   */
  export class ContextualizedRenderer {
    /**
     * The template renderer this renderer uses templates from.
     */
    public parent: FloofRenderer;
    
    /**
     * The floofball this engine is bound to.
     */
    public floofball: FloofBall;
    
    /**
     * The request this engine is bound to.
     */
    public req: FloofRequest;
    
    /**
     * Renders a template file to HTML with the given rendering context.
     * Also available in context are the associated floofball's default context and the associated request object.
     * @param file The template file to render. Should be located in /templates.
     * @param context The context to render the template file with.
     * @returns A promise that resolves when the rendering is complete.
     */
    public render(file: string, context: RenderContext): Promise<string>;
  }
  
  /**
   * An object representing an incoming request.
   * Any path parameters and query parameters are also exposed as properties of a FloofRequest.
   * Path parameters take priority if a conflict arises with a query parameter.
   */
  export class FloofRequest {
    /**
     * The original path as defined by the endpoint.
     * Use FloofRequest#url to get the request with parameters interpolated.
     */
    public path: EndpointPath;
    
    /**
     * The backing IncomingMessage object wrapped by this FloofRequest.
     */
    public backing: IncomingMessage;
    
    /**
     * The HTTP verb this request was made with.
     */
    public method: HttpVerb;
    
    /**
     * The HTTP status code this request was made with.
     */
    public code: number;
    
    /**
     * The HTTP status message this request's status code is associated with.
     */
    public status: string;
    
    /**
     * The full URL this request was made to.
     */
    public rawUrl: string;
    
    /**
     * The path this request was made to with parameters included.
     * Use FloofRequest#path to get the original endpoint's path.
     */
    public url: string;
    
    /**
     * Retrieves a request header.
     * @param key The header to retrieve.
     * @returns The header value, or null if none exists.
     */
    public header(key: string): string;
    
    /**
     * Retrieves a path parameter.
     * @param key The parameter to retrieve.
     * @returns The parameter value, adapted to whatever type the parameter is specified as.
     */
    public param(key: string): any;
    
    /**
     * Retrieves a query parameter.
     * @param key The parameter to retrieve.
     * @returns The parameter value, adapted to whatever type the parameter is specified as.
     */
    public query(key: string): any;
    
    /**
     * Retrieves a cookie value.
     * @param key The key of the cookie value to retrieve.
     * @returns The cookie value associated with the given key, or null if none exists.
     */
    public cookie(key: string): string;
    
    /**
     * Retrieves the message body.
     * @returns A promise that resolves with the body, parsed as whatever type was specified.
     */
    public body(): Promise<any>;
  }
  
  /**
   * An HTTP error. When thrown, replies with the HTTP status code specified and invokes associated error handlers.
   */
  export class Floop extends Error {
    /**
     * Creates a new Floop.
     * @param code The HTTP status code to throw.
     * @param message The status message to send. Defaults to a generic message associated with each code.
     */
    constructor(code: number, message?: string);
  }
  
  /**
   * A response object.
   */
  export class Stoof {
    /**
     * Creates a new Stoof instance.
     * @param code The HTTP status code to respond with.
     * @param body The body of the response.
     */
    constructor(code: number, body: string);
    
    /**
     * Creates a new Stoof instance with HTTP status code 200.
     * @param body The body of the response.
     */
    constructor(body: string);
    
    /**
     * Sets a header to be sent with the response.
     * @param key The header name.
     * @param value The header value.
     * @returns This Stoof instance, for the sake of chaining.
     */
    public header(key: string, value: string): Stoof;
    
    /**
     * Defines a cookie value to be set in the response.
     * @param key The key associated with the value.
     * @param value The cookie value.
     * @param maxAge The max time for the cookie to persist, in milliseconds.
     * @param path The cookie value's path.
     * @returns This Stoof instance, for the sake of chaining.
     */
    public cookie(key: string, value: string, maxAge?: number, path?: string): Stoof;
    
    /**
     * Defines a cookie value to be unset in the response.
     * @param key The key associated with the cookie value.
     * @param path The cookie value's path.
     * @returns This Stoof instance, for the sake of chaining.
     */
    public uncookie(key: string, path?: string): Stoof;
  }
  
  /**
   * Generates a response that redirects to a URL.
   * @param url The URL to redirect to.
   * @param code The HTTP status code to redirect with. Defaults to 302.
   * @returns This Stoof instance, for the sake of chaining.
   */
  export function redirect(url: string, code?: RedirectCode): Stoof;
}