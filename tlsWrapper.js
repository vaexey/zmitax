
const tls = require("tls")

let config = {
    passExpired: true
}

const tlsConnectOriginal = tls.connect;
const tlsConnectWrap = (...args) => {
    const socket = tlsConnectOriginal.apply(this, args);

    const verifyErrorOriginal = socket._handle.verifyError.bind(socket._handle);
    const verifyErrorWrap = (...args) => {
        const error = verifyErrorOriginal();

        if(config.passExpired && error.code === 'CERT_HAS_EXPIRED')
        {
            console.warn("Passing TLS expired certificate.")

            return null;
        }

        return error;
    }

    Object.defineProperty(socket._handle, 'verifyError', {
        __proto__: null,
        enumerable: true,
        value: verifyErrorWrap,
        writable: false
    })

    return socket;
}

exports.wrap = () => {
    tls.connect = tlsConnectWrap;
}

exports.config = config