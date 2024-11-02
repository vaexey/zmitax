import * as http from "http"
import { ZmitaxConfig } from "./ZmitaxConfig"

export abstract class Plugin
{
    /**
     * Parent proxy config
     */
    protected config: ZmitaxConfig

    /**
     * Plugin ID
     */
    public abstract getId(): string

    /**
     * Plugin display name
     */
    public abstract getName(): string

    /**
     * Plugin description
     */
    public abstract getDescription(): string

    /**
     * Plugin priority (0 by default)
     * where bigger priority plugins' function
     * will be executed first
     * @returns priority
     */
    public getPriority(): number
    {
        return 0
    }

    /**
     * Logger function wrapper for plugin to use
     * @param value any value to log
     */
    protected log(value: any)
    {
        console.log(`${this.getId()} :: ${value}`)
    }

    /**
     * Helper method to set config on proxy construction
     * @param config config
     */
    public setConfig(config: ZmitaxConfig)
    {
        this.config = config
    }

    /**
     * When proxy is initialized (listen method)
     */
    public async init(): Promise<void>
    {}

    /**
     * When an error has been encountered
     * @param error Error string
     * @returns Finish, if event propagation should stop here
     * or else pass next to next plugin
     */
    public async onError(error: string): Promise<{finish: boolean, next: string}>
    {
        return {
            finish: false,
            next: error
        }
    }

    /**
     * When an error should be handled
     * @param error Error string
     * @returns True if event propagation should stop here
     */
    public async onErrorHandle(error: string, res: http.ServerResponse): Promise<boolean>
    {
        return false
    }

    /**
     * When a request header has been received
     * @param req request
     * @param res response
     * @returns True if event propagation should stop here (eg. response has been sent)
     */
    public async onRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<boolean>
    {
        return false
    }

    /**
     * When a response body from server has been received
     * @param clientReq client request
     * @param serverResponse server response
     * @param body server response body
     * @returns transformed (or not) body of request
     */
    public async onResponse(clientReq: http.IncomingMessage, serverResponse: http.IncomingMessage, body: string): Promise<string>
    {
        return body
    }

    /**
     * When a response to client needs to be sent
     * @param clientReq client request
     * @param clientRes client response 
     * @param serverResponse server response
     * @param body server response body
     * @returns True if event propagation should stop here (eg. response has been sent)
     */
    public async onProxy(clientReq: http.IncomingMessage, clientRes: http.ServerResponse, serverResponse: http.IncomingMessage, body: string): Promise<boolean>
    {
        return false
    }
}