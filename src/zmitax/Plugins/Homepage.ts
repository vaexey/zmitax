import { IncomingMessage, ServerResponse } from "http";
import { Plugin } from "../Plugin";

import * as url from "url"

export class HomepagePlugin extends Plugin
{
    public getId(): string {
        return "homepage"
    }

    public getName(): string {
        return "Homepage"
    }

    public getDescription(): string {
        return "Redirects empty query / to specified homepage URL"
    }

    private homepage?: string

    public async init(): Promise<void> {
        let homepage = this.config.plugins["homepage"]

        if(homepage)
        {
            this.homepage = "" + homepage
        }
        else
        {
            this.log(`${this.getName()} plugin is enabled, but homepage config entry is nonexistent`)
        }
    }
    
    public async onRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
        if(!this.homepage)
            return false

        const parsedUrl = url.parse(req.url, false)

        if(parsedUrl.path !== "/")
            return false

        res.writeHead(302, {
            location: this.homepage
        })
        res.end()

        this.log(`Redirected to homepage`);

        return true
    }
}