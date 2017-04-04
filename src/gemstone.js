/*
**  GemstoneJS -- Gemstone JavaScript Technology Stack
**  Copyright (c) 2016-2017 Gemstone Project <http://gemstonejs.com>
**  Licensed under Apache License 2.0 <https://spdx.org/licenses/Apache-2.0>
*/

/*
 *  The external dependencies
 */

/*  FIXME  */

/*
 *  The Gemstone API
 */

import Latching from "latching"

let latching = new Latching()

export default class Gemstone {
    /*  latching integration  */
    at      (...args) { return latching.at(...args) }
    latch   (...args) { return latching.latch(...args) }
    unlatch (...args) { return latching.unlatch(...args) }

    /*  the bootstrapping API method  */
    static async boot (options) {
        latching.hook("boot-enter", "pass", options)

        /*  default options  */
        options = Object.assign({
            app:    "example",
            config: { env: "development", tag: "" },
            ui:     () => [ "root", {}, "visible" ],
            sv:     (url, cid) => {}
        }, options)
        latching.hook("boot-options", "pass", options)

        /*  FIXME  */

        latching.hook("boot-leave", "none")
    }

    /*  the shutdown API method  */
    static async shutdown () {
        latching.hook("shutdown-enter", "none")

        /*  FIXME  */

        latching.hook("shutdown-leave", "none")
    }
}

