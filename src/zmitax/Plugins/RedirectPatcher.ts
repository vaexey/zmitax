import { IncomingMessage, ServerResponse } from "http";
import { Plugin } from "../Plugin";



export class RedirectPatcherPlugin extends Plugin
{
    public getId(): string {
        return "redirectPatcher"
    }

    public getName(): string {
        return "Redirect Patcher"
    }

    public getDescription(): string {
        return "Patches redirect requests that would break proxy redirects otherwise"
    }

    private from: string[]
    private to: string

    public async init(): Promise<void> {
        let patcherConfig = this.config.plugins["redirectPatcher"]

        this.from = Array.isArray(patcherConfig.from) ?
            patcherConfig.from as string[] :
            []

        this.to = patcherConfig.to ?
            patcherConfig.to as string : 
            `http://${this.config.proxy.host}:${this.config.proxy.port}/$1`
    }

    public async onResponse(clientReq: IncomingMessage, serverResponse: IncomingMessage, body: string): Promise<string> {
        if(serverResponse.statusCode == 302)
        {
            let redir = serverResponse.headers.location
            let original = redir

            this.from.forEach(pattern => {
                redir = redir.replaceAll(new RegExp(pattern, "gi"), this.to)
            })

            serverResponse.headers.location = redir

            this.log(`Patched 302 redirect from "${original}" to "${redir}"`)
        }

        return body
    }
}