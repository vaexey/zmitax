import { HomepagePlugin } from "./Homepage"
import { InjectPlugin } from "./Inject"
import { ISOFIXPlugin } from "./ISOFIX"
import { LinkPatcherPlugin } from "./LinkPatcher"
import { RedirectPatcherPlugin } from "./RedirectPatcher"
import { StaticPlugin } from "./Static"

export function createAllPlugins()
{
    return [
        new HomepagePlugin(),
        new RedirectPatcherPlugin(),
        new LinkPatcherPlugin(),
        new ISOFIXPlugin(),
        new StaticPlugin(),
        new InjectPlugin()
    ]
}