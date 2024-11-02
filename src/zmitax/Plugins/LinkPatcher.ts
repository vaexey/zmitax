import { IncomingMessage, ServerResponse } from "http";
import { Plugin } from "../Plugin";



export class LinkPatcherPlugin extends Plugin
{
    public getId(): string {
        return "linkPatcher"
    }

    public getName(): string {
        return "Link Patcher"
    }

    public getDescription(): string {
        return "Patches links that would have been broken otherwise"
    }

    private from: string[]
    private to: string

    public async init(): Promise<void> {
        let patcherConfig = this.config.plugins["linkPatcher"]

        this.from = Array.isArray(patcherConfig.from) ?
            patcherConfig.from as string[] :
            []

        this.to = patcherConfig.to ?
            patcherConfig.to as string : 
            `http://${this.config.proxy.host}:${this.config.proxy.port}/$1`
    }

    public async onResponse(clientReq: IncomingMessage, serverResponse: IncomingMessage, body: string): Promise<string> {
        this.from.forEach(pattern => {
            body = body.replaceAll(new RegExp(pattern, "gi"), this.to)
        })

        return body
    }
}