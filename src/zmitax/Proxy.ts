import { ZmitaxConfig } from "./ZmitaxConfig";

import * as http from "http"
import * as https from "https"
import { TLSWrapper } from "./TLSWrapper";
import { Plugin } from "./Plugin";

export class Proxy
{
    config: ZmitaxConfig
    server: http.Server
    plugins: Plugin[]

    constructor(config: ZmitaxConfig, plugins?: Plugin[])
    {
        this.config = config
        this.server = this.createProxy()
        this.plugins = plugins ? [...plugins] : []

        this.plugins.forEach(p => p.setConfig(config))
        this.plugins.sort((a, b) => b.getPriority() - a.getPriority())
    }

    private log(value: any)
    {
        console.log(`${new Date().toISOString()} :: ${value}`)
    }

    private createProxy(): http.Server
    {
        return http.createServer((creq, cres) => {
            this.tryHandleServerRequest(creq, cres)
        })
    }

    private async tryHandleServerRequest(creq: http.IncomingMessage, cres: http.ServerResponse)
    {
        try {
            await this.handleServerRequest(creq, cres)
        } catch (error) {
            for(const p of this.plugins)
            {
                const result = await p.onError(""+error)

                error = result.next

                if(result.finish)
                    break
            }

            for(const p of this.plugins)
            {
                if(await p.onErrorHandle(error, cres))
                {
                    return
                }
            }

            cres.writeHead(500)
            cres.write("Unhandled error: " + error)
            cres.end()
        }
    }

    private async handleServerRequest(creq: http.IncomingMessage, cres: http.ServerResponse)
    {
        for(const p of this.plugins)
        {
            if(await p.onRequest(creq, cres))
            {
                return
            }
        }

        creq.headers.host = this.config.server.hostname

        const proxiedOptions: https.RequestOptions = {
            host: this.config.server.address,
            servername: this.config.server.hostname,
            port: this.config.server.port,

            path: creq.url,
            method: creq.method,
            headers: creq.headers,

            minVersion: this.config.server.tls.version
        }

        // Shenanigans to make https request awaitable
        let bodyResolve: (chunks: [http.IncomingMessage, Buffer[]]) => void
        let bodyReject: (err: Error) => void
        const bodyReady = new Promise<[http.IncomingMessage, Buffer[]]>((res, rej) => {
            bodyResolve = res
            bodyReject = rej
        })

        const proxied = https.request(proxiedOptions, (pres) => {
            let bodyChunks = []

            pres.on('data', (chunk: Buffer) => {
                bodyChunks.push(chunk)
            })

            pres.on('end', () => {
                bodyResolve([pres, bodyChunks])
            })

            pres.on('error', (err) => {
                bodyReject(err)
            })
        })

        proxied.on('error', (err) => {
            bodyReject(err)
        })

        creq.pipe(proxied)

        const [pres, bodyChunks] = await bodyReady
        const bodyBuffer = Buffer.concat(bodyChunks)

        // const decoder = new TextDecoder(this.config.server.bodyEncoding)
        // let body = decoder.decode(bodyBuffer)

        let body = ""
        for(let b of bodyBuffer)
        {
            body += String.fromCharCode(b)
        }

        for(const p of this.plugins)
        {
            body = await p.onResponse(creq, pres, body)
        }

        pres.headers["content-length"] = body.length.toString()

        for(const p of this.plugins)
        {
            if(await p.onProxy(creq, cres, pres, body))
                return
        }

        const newBodyBuffer = Buffer.from(
            body.split("").map(ch => ch.charCodeAt(0))
        )
        
        cres.writeHead(pres.statusCode, pres.headers)
        cres.write(newBodyBuffer)
        cres.end()
    }

    public async listen(): Promise<void>
    {
        this.log(`Applying TLSWrapper patches...`)
        TLSWrapper.apply(this.config.server.tls)

        if(this.plugins.length > 0)
        {
            this.log(`Initializing ${this.plugins.length} plugins...`)
            
            await Promise.all(this.plugins.map(p => p.init()))
        }

        return new Promise((res, rej) => {
            try {
                this.server.listen({
                    port: this.config.proxy.port
                }, () => {
                    this.log(`Proxy server listening on http://${
                        this.config.proxy.host
                    }:${
                        this.config.proxy.port
                    }/`)

                    res()
                })
            } catch (error) {
                rej(error)
            }
        })
    }
}