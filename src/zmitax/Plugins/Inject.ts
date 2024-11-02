import { IncomingMessage } from "http";
import { Plugin } from "../Plugin";

import * as fs from "fs/promises"

export class InjectPlugin extends Plugin
{
    public getId(): string {
        return "inject"
    }

    public getName(): string {
        return "Inject"
    }

    public getDescription(): string {
        return "Injects content into request body"
    }

    private inject: string

    public async init(): Promise<void> {
        //TODO: verify config
        let inject = this.config.plugins["inject"]

        this.inject = inject + ""
    }

    public async onResponse(clientReq: IncomingMessage, serverResponse: IncomingMessage, body: string): Promise<string> {
        //TODO: filter
        const toInject = await fs.readFile(this.inject)

        body = body + toInject.toString()

        return body
    }
}