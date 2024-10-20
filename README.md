# zmitac-proxy
A simple remote https to local http proxy that allows to open websites that are still using the obsolete TLSv1 (or similiar) protocol.
Applies modifications to every `text/html` response, allowing for easy visual enhancements to the websites.  
The default config for this proxy allows to connect to SUT ZMiTAC database web app which uses TLS v1 and is unavailable in modern browsers.  

![Picture of a modified website](/docs/website.png?raw=true "Modified website")

## Prerequisites
This project requires [NodeJS and NPM](https://nodejs.org/en).

## Installation

#### A. Stable version
> [!WARNING]
> No stable version has been released yet. Currently the only option available is to clone this repository.

#### B. Latest features from git
Clone this repository
```
git clone https://github.com/vaexey/zmitac-proxy.git
```

## Configuration
The configuration JSON file is stored at `./config.json`. Proxy must be restarted to reload config.  
|           Field           |                                        Description                                       |             Default value             |
|:-------------------------:|:----------------------------------------------------------------------------------------:|:-------------------------------------:|
|      `server.address`     | Domain or IP address where the proxied server is available at.                           |       `"db.zmitac.aei.polsl.pl"`      |
|     `server.hostname`     | Hostname of the proxied server. Server must be configured to recognize this hostname.    |       `"db.zmitac.aei.polsl.pl"`      |
|    `server.redirectsTo`   | An array of URLs that need to be routed back to localhost after a HTTP redirect request. | `["https://db.zmitac.aei.polsl.pl/"]` |
|     `server.homepage`     | An URL to which all requests containing path `/` will be redirected (optional).          |         `"/baza/st_main.php"`         |
|       `server.port`       | Remote server port. For SSL it is 443 by default.                                        |                 `443`                 |
|        `server.tls`       | TLS version of the remote server.                                                        |               `"TLSv1"`               |
| `server.allowExpiredCert` | Boolean value whether certificate expiration date should be ignored.                     |                 `true`                |
|        `proxy.port`       | Port for the proxy server, eg. for http://localhost:5613/ it is 5613.                    |                 `5613`                |
|        `proxy.host`       | Host for the proxy server. Change it only if you use custom `/etc/hosts` for localhost.  |             `"localhost"`             |
|     `proxy.fillsFile`     | Location of file that is injected into every `text/html` response.                       |        `"./static/fills.html"`        |
|     `proxy.errorFile`     | Location of file that is send as a response whenever the proxy receives an exception.    |        `"./static/error.html"`        |

## Usage
Launch the server
```
cd zmitac-proxy
npm start
```
Open `http://localhost:PORT/` in your browser, where `PORT` is the port you defined in `config.json`.  
Example: http://localhost:5613/  

## Important notes
TLSv1 is considered obsolete and unsafe. 
Automated requests may be ignored, blocked or even cause legal trouble. 
Local proxy server if not put behind a firewall may be exploited for abuse. 
> [!CAUTION]
> Use this code at your own risk.

## License
The software is licensed under [3-Clause BSD NON-AI License](https://github.com/vaexey/zmitac-proxy/blob/master/LICENSE).