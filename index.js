const http = require("http");
const https = require("https");
const url = require("url");
const fs = require("fs");
const stream = require("stream");
const tlsWrapper = require("./tlsWrapper");

const config = require("./config.json");

console.log("Starting zmitax...");

console.log("Loading defined html files...");
const fillsContent = fs.readFileSync(config.proxy.fillsFile);
const errorContent = fs.readFileSync(config.proxy.errorFile);

tlsWrapper.wrap();
tlsWrapper.config.passExpired = config.server.allowExpiredCert;

let requestCount = 0;
const proxyServer = http.createServer((req, res) => {
    const requestId = requestCount++;

    const handleError = (rawErr) => {
        res.writeHead(500);

        let err = rawErr + ""

        if(err.includes("ssl_choose_client_version:unsupported protocol"))
        {
            err = `Target server uses unsupported protocol. Change the server.tls parameter in config to a valid protocol this server is using.`
        } else if(err === "Error: certificate has expired") {
            err = `Target server uses expired certificate. Refresh the certificate or change the server.allowExpiredCert parameter in config to true.`
        }

        const errorString = 
            errorContent
            .toString()
            .replace("{{error}}", err);

        res.write(errorString);
        res.end();

        console.log(`${requestId} :: Encountered error: `, rawErr);
    }

    try {
        const parsedUrl = url.parse(req.url, false);

        console.log(`${requestId} :: Incoming connection from ${req.socket.remoteAddress} requesting ${req.url}`);

        if(config.server.homepage && parsedUrl.path == "/")
        {
            res.writeHead(302, {
                location: config.server.homepage
            })
            res.end()

            console.log(`${requestId} :: Redirected to homepage`);

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
                        `http://${config.proxy.host}:${config.proxy.port}/`
                    );
                })

                pres.headers.location = redir;

                console.log(`${requestId} :: Incoming 302 redirect patched`);
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

                console.log(`${requestId} :: Incoming text/html patched and piped`);

                return
            }

            res.writeHead(pres.statusCode, pres.headers);
            pres.pipe(res);

            console.log(`${requestId} :: Incoming generic response patched and piped`);
        })

        proxy.on('error', (error) => {
            handleError(error)
        })

        req.pipe(proxy)
    } catch (error) {
        handleError(error);
    }
})

proxyServer.listen(config.proxy.port);

console.log(`Proxy listening on ${config.proxy.port}`);
console.log(`Open http://${config.proxy.host}:${config.proxy.port}/ in browser.`);