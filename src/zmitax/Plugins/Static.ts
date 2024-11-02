import { IncomingMessage, ServerResponse } from "http";
import { Plugin } from "../Plugin";

import * as url from "url"
import * as fs from "fs/promises"
import * as mimeTypes from "mime-types"

export class StaticPlugin extends Plugin
{
    public getId(): string {
        return "static"
    }

    public getName(): string {
        return "Static"
    }

    public getDescription(): string {
        return "Serves static files"
    }

    private path: string
    private url: string

    public async init(): Promise<void> {
        let staticConfig = this.config.plugins["static"]

        this.path = staticConfig.path + ""
        this.url = staticConfig.url + ""
    }
    
    public async onRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
        // TODO: Check config validity, set proper content-type and handle errors
        // TODO: Fix path traversal exploit

        const parsedUrl = url.parse(req.url, false).path

        if(!parsedUrl.startsWith(this.url))
        {
            return false
        }

        const localPath = this.path + parsedUrl.substring(this.url.length)

        const mimeType = mimeTypes.lookup(localPath)

        if(!mimeType)
        {
            throw `Static file ${parsedUrl} cannot be served`
        }

        const content = await fs.readFile(localPath)

        res.writeHead(200, {
            "content-type": mimeType
        })
        res.write(content)
        res.end()

        this.log(`Served static file ${parsedUrl}`);

        return true
    }
}