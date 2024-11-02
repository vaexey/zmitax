import { IncomingMessage, ServerResponse } from "http";
import { Plugin } from "../Plugin";

export class ISOFIXPlugin extends Plugin
{
    public getId(): string {
        return "isofix"
    }

    public getName(): string {
        return "ISOFIX"
    }

    public getDescription(): string {
        return "Converts buffer from specified ISO encoding into human readable UTF-8. Also patches meta tag in html."
    }

    public getPriority(): number {
        return -100
    }

    private encoding: string
    private urlFilter: string

    public async init(): Promise<void> {
        let isofix = this.config.plugins["isofix"]

        this.encoding = isofix.encoding ?
            isofix.encoding as string :
            "utf-8"

        this.urlFilter = isofix.urlFilter ?
            isofix.urlFilter as string :
            ".*"
    }

    private urlMatch(clientReq: IncomingMessage): boolean
    {
        return !!clientReq.url.match(new RegExp(this.urlFilter, "gi"))
    }

    public async onResponse(clientReq: IncomingMessage, serverResponse: IncomingMessage, body: string): Promise<string> {
        if(!this.urlMatch(clientReq))
        {
            return body
        }

        const bodyBuffer = Buffer.from(
            body.split("").map(ch => ch.charCodeAt(0))
        )

        const decoder = new TextDecoder(this.encoding)
        let bodyDecoded = decoder.decode(bodyBuffer)

        const metaRegex = new RegExp(
            `<meta +http-equiv *= *"content-type" +content *= *" *text\\/html; *charset *= *${this.encoding} *" *>`,
            "gi"
        )
        const metaReplacement =
            `<meta http-equiv="content-type" content="text/html; charset=utf-8">`

        const formRegex = new RegExp(
            "<form(.*)>",
            "gi"
        )
        const formReplacement =
            `<form$1 accept-charset="${this.encoding}">`

        bodyDecoded = bodyDecoded
            .replaceAll(metaRegex, metaReplacement)
            .replaceAll(formRegex, formReplacement)

        return bodyDecoded
    }

    public async onProxy(clientReq: IncomingMessage, clientRes: ServerResponse, serverResponse: IncomingMessage, body: string): Promise<boolean> {
        if(!this.urlMatch(clientReq))
        {
            return false
        }

        const bodyBuffer = Buffer.from(body, "utf-8")

        serverResponse.headers["content-length"] = bodyBuffer.length+""

        clientRes.writeHead(serverResponse.statusCode, serverResponse.headers)
        clientRes.write(bodyBuffer)
        clientRes.end()

        this.log(`Converted ${this.encoding.toUpperCase()} encoding to UTF-8`)

        return true
    }
}