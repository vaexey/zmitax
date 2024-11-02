import * as tls from "tls"

/**
 * Patcher for native node package "tls"
 * Currently only supports wrapping tls.connect(...)
 * to allow underlying verifyErrorOriginal(...)
 * to pass CERT_HAS_EXPIRED exception
 */
export abstract class TLSWrapper
{
    /**
     * Contains options that were set using apply (if any)
     */
    static settings?: TLSWrapperOptions

    /**
     * Returns options that were set using apply (if any)
     */
    public static getAppliedSettings(): TLSWrapperOptions | undefined
    {
        return this.settings
    }

    /**
     * Applies patches to the TLS package
     * @param options patching options
     */
    public static apply(options?: TLSWrapperOptions)
    {
        if(this.settings)
        {
            throw 'TLSWrapper cannot change its options after applying them once'
        }

        const defaults: TLSWrapperOptions = {
            wrapTlsConnect: false,
            passExpiredCertificates: false
        }

        options = {
            ...defaults,
            ...options
        }

        this.settings = options

        if(options.wrapTlsConnect)
            this.applyTlsConnect()

        if(options.forceMinTlsVersion)
            this.applyMinTlsVersion()

        if(options.forceLowestSecurityLevel)
            this.applyLowestSecurityLevel()
    }

    /**
     * Applies patch to the tls.connect function
     */
    static applyTlsConnect()
    {
        const tlsConnectOriginal = tls.connect
        const tlsConnectWrap = (...args) => {
            const socket = tlsConnectOriginal.apply(this, args);
        
            const verifyErrorOriginal = socket._handle.verifyError.bind(socket._handle);
            const verifyErrorWrap = (...args) => {
                const error = verifyErrorOriginal();
        
                if(this.settings.passExpiredCertificates && error && error.code === 'CERT_HAS_EXPIRED')
                {
                    console.warn("TLSWrapper :: Passing expired certificate.")
        
                    return null;
                }
        
                return error;
            }
        
            Object.defineProperty(socket._handle, 'verifyError', {
                __proto__: null,
                enumerable: true,
                value: verifyErrorWrap,
                writable: false
            } as PropertyDescriptor)
        
            return socket;
        }

        // readonly property cannot be assigned
        // tls.connect = tlsConnectWrap
        tls[<any>"connect"] = tlsConnectWrap

        console.warn("TLSWrapper :: A patch has been globally applied to the 'tls' package. Using this patch in context of any app that is not zmitax is a serious security concern.")
    }

    static applyMinTlsVersion()
    {
        tls[<any>"DEFAULT_MIN_VERSION"] = this.settings.version

        console.warn(`TLSWrapper :: TLS minimal version has been dropped to ${this.settings.version}.`)
    }

    static applyLowestSecurityLevel()
    {
        tls[<any>"DEFAULT_CIPHERS"] = "DEFAULT@SECLEVEL=0"

        console.warn("TLSWrapper :: TLS security has been dropped to the lowest level.")
    }
}

export interface TLSWrapperOptions
{
    forceLowestSecurityLevel?: boolean
    forceMinTlsVersion?: boolean
    version?: tls.SecureVersion
    wrapTlsConnect?: boolean
    passExpiredCertificates?: boolean 
}