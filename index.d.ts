declare module 'floof' {
  import { IncomingMessage } from 'http';
  
  type BodyParser = (req: IncomingMessage) => any
    | (req: IncomingMessage) => Promise<any>;
  
  type TypeAdapter = (s: string) => any
    | (s: string) => Promise<any>;
  
  type RenderContext = {[key: string]: any};
  
  export class Floof {
    constructor();
    
    public renderer: FloofRenderer;
    
    public parser(type: string, parser: BodyParser): Floof;
    
    public adapter(type: string, adapter: TypeAdapter): Floof;
    
    public before(): GlobalBeforeHandler;
    
    public after(): GlobalAfterHandler;
    
    public error(): ErrorHandler;
    
    public ball(floofball: FloofBall): Floof;
    
    public go(host: string, port: number): Promise<void>;
  }
  
  export class FloofBall {
    constructor();
    
    public adaptBody(type: string): FloofBall;
    
    public context(type: RenderContext): FloofBall;
    
    public before(): BeforeHandler;
      
    public after(): AfterHandler;
    
    public error(): ErrorHandler;
    
    public endpoint(method: string, path: string): EndpointHandler;
    
    public get(path: string): EndpointHandler;
    
    public head(path: string): EndpointHandler;
    
    public post(path: string): EndpointHandler;
    
    public put(path: string): EndpointHandler;
    
    public patch(path: string): EndpointHandler;
    
    public delete(path: string): EndpointHandler;
  }
  
  export class AroundHandler {
    public when(filter: (...args: any[]) => boolean): AroundHandler;
    
    public exec(func: (...args: any[]) => void): AroundHandler;
  }
  
  export class BeforeHandler extends AroundHandler {
    public when(filter: (req: FloofRequest) => boolean): BeforeHandler;
    
    public exec(func: (req: FloofRequest) => void): BeforeHandler;
  }
  
  export class AfterHandler extends AroundHandler {
    public when(filter: (req: FloofRequest, res: Stoof) => boolean): AfterHandler;
    
    public exec(func: (req: FloofRequest, res: Stoof) => void): AfterHandler;
  }
  
  export class GlobalBeforeHandler extends AroundHandler {
    public when(filter: (req: IncomingMessage, params: Map<string, string>) => boolean): GlobalBeforeHandler;
    
    public exec(func: (req: IncomingMessage, params: Map<string, string>) => void): GlobalBeforeHandler;
  }
  
  export class GlobalAfterHandler extends AroundHandler {
    public when(filter: (req: IncomingMessage, res: Stoof, params: Map<string, string>) => boolean): GlobalAfterHandler;
    
    public exec(func: (req: IncomingMessage, res: Stoof, params: Map<string, string>) => void): GlobalAfterHandler;
  }
  
  export class ErrorHandler {
    public forCode(...code: number[]): ErrorHandler;
    
    public forCodes(startIncl: number, endExcl: number): ErrorHandler;
    
    public exec(func: (code: number, msg: string, ren: ContextualizedRenderer)): void;
  }
  
  export class GlobalErrorHandler {
    public forCode(...code: number[]): GlobalErrorHandler;
    
    public forCodes(startIncl: number, endExcl: number): GlobalErrorHandler;
    
    public exec(func: (code: number, msg: string, ren: Renderer)): void;
  }
  
  export class EndpointHandler {
    public withQuery(key: string, type?: string, req?: boolean): EndpointHandler;
    
    public withBody(type: string): EndpointHandler;
    
    public exec(func: (req: FloofRequest, ren: ContextualizedRenderer) => Stoof): void;
  }
  
  export class FloofRenderer {
    public render(file: string, context: RenderContext): Promise<string>;
    
    public recompile(): void;
  }
  
  export class ContextualizedRenderer {
    public parent: FloofRenderer;
    
    public floofball: FloofBall;
    
    public req: FloofRequest;
    
    public render(file: string, context: RenderContext): Promise<string>;
  }
  
  export class FloofRequest {
    public path: string;
    
    public backing: IncomingMessage;
    
    public method: string;
    
    public code: number;
    
    public status: string;
    
    public rawUrl: string;
    
    public url: string;
    
    public header(key: string): string;
    
    public param(key: string): any;
    
    public query(key: string): any;
    
    public cookie(key: string): string;
    
    public body(): Promise<any>;
  }
  
  export class Floop extends Error {
    constructor(code: number, message?: string);
  }
  
  export class Stoof {
    constructor(code: number, body: string);
    
    constructor(body: string);
    
    public header(key: string, value: string): Stoof;
    
    public cookie(key: string, value: string, maxAge?: number, path?: string): Stoof;
    
    public uncookie(key: string, path?: string): Stoof;
  }
  
  export function redirect(url: string, code?: number): Stoof;
}