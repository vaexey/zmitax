const http = require("http");
const https = require("https");
const url = require("url");
const fs = require("fs");
const stream = require("stream");
const tlsWrapper = require("./tlsWrapper");

const config = require("./config.json");

console.log("Starting zmitac-proxy...");

console.log("Loading defined html files...");
const fillsContent = fs.readFileSync(config.proxy.fillsFile);
const errorContent = fs.readFileSync(config.proxy.errorFile);

tlsWrapper.wrap();

const proxyServer = http.createServer((req, res) => {
    try {
        if(url.parse(req.url, false).path == "/")
        {
            res.writeHead(302, {
                location: config.server.homepage
            })
            res.end()

            return
        }

        const reqHeaders = req.headers;

        reqHeaders.host = config.server.hostname;

        /** @type {https.RequestOptions} */
        const opt = {
            host: config.server.address,
            servername: config.server.hostname,
            port: config.server.port,
            path: req.url,
            method: req.method,
            headers: reqHeaders,
            minVersion: config.server.tls,
            maxVersion: config.server.tls
        }

        const proxy = https.request(opt, (pres) => {

            if(pres.statusCode == 302)
            {
                let redir = pres.headers.location
                
                config.server.redirectsTo.forEach(url => {
                    redir = redir.replace(
                        url,
                        `http://localhost:${config.proxy.port}/`
                    );
                })

                pres.headers.location = redir;
            }

            if(pres.headers["content-type"] === "text/html")
            {
                pres.headers["content-length"] = +pres.headers["content-length"] + fillsContent.length;

                res.writeHead(pres.statusCode, pres.headers);

                const htmlAppendTransform = new stream.Transform({
                    transform: (chunk, encoding, next) => {
                        next(null, new Uint8Array([
                            ...chunk,
                            ...fillsContent
                        ]))
                    }
                })

                pres.pipe(htmlAppendTransform).pipe(res);

                return
            }

            res.writeHead(pres.statusCode, pres.headers);
            pres.pipe(res);
        })

        req.pipe(proxy)
    } catch (error) {
        res.writeHead(500);

        const errorString = 
            errorContent
            .toString()
            .replace("{{error}}", error);

        res.write(errorString);
        res.end();
    }
})

proxyServer.listen(config.proxy.port);

console.log(`Proxy listening on ${config.proxy.port}`);
console.log(`Open http://localhost:${config.proxy.port}/ in browser.`);