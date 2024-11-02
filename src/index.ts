import { readFileSync } from "fs";
import { Proxy } from "./zmitax/Proxy";
import { ZmitaxConfig } from "./zmitax/ZmitaxConfig";
import { createAllPlugins } from "./zmitax/Plugins";

const config: ZmitaxConfig = JSON.parse(
    readFileSync("./config.json").toString()
) as ZmitaxConfig

const plugins = createAllPlugins()

const zmitax = new Proxy(config, plugins)

zmitax.listen()