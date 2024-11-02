import { SecureVersion } from "tls"
import { TLSWrapperOptions } from "./TLSWrapper"

export class ZmitaxConfig
{
    public server: ZmitaxConfigServer
    public proxy: ZmitaxConfigProxy
    public plugins: ZmitaxConfigPlugins
}

export class ZmitaxConfigServer
{
    public address: string
    public hostname: string
    public port: number
    public tls: ZmitaxConfigTLS
}

export class ZmitaxConfigTLS implements TLSWrapperOptions
{
    public version: SecureVersion
    public wrapTlsConnect: boolean
    public passExpiredCertificates: boolean
    public forceMinTlsVersion: boolean
    public orceLowestSecurityLevel: boolean
}

export class ZmitaxConfigProxy
{
    public port: number
    public host: string
}

export type ZmitaxConfigPlugins = {
    [key: string]: ZmitaxConfigPluginsEntry
}
export type ZmitaxConfigPluginsEntry = {
    [key: string]:
        ZmitaxConfigPluginsEntryValue |
        ZmitaxConfigPluginsEntryValue[]
}
export type ZmitaxConfigPluginsEntryValue = 
    ZmitaxConfigPluginsEntry |
    string |
    number |
    null