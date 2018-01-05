/*
**  GemstoneJS -- Gemstone JavaScript Technology Stack
**  Copyright (c) 2016-2018 Gemstone Project <http://gemstonejs.com>
**  Licensed under Apache License 2.0 <https://spdx.org/licenses/Apache-2.0>
*/

/*
 *  The external dependencies
 */

const Microkernel = require("microkernel")
const SysPath     = require("syspath")
const Latching    = require("latching")

/*
 *  The Gemstone API
 */

let latching = new Latching()
let kernel   = null

export default class Gemstone {
    /*  latching integration  */
    at      (...args) { return latching.at(...args) }
    latch   (...args) { return latching.latch(...args) }
    unlatch (...args) { return latching.unlatch(...args) }

    /*  the bootstrapping API method  */
    static async boot (options) {
        latching.hook("boot-enter", "pass", options)

        /*  instanciate microkernel  */
        kernel = new Microkernel()

        /*  determine options  */
        options = Object.assign({
            app:     "example",
            ini:     "example.ini",
            config:  { env: "development", tag: "" },
            modules: [ "**/*.mod.js" ]
        }, options)
        latching.hook("boot-options", "none", options)
        kernel.rs("options", options)

        /*  define state transitions  */
        kernel.transitions([
            { state: "dead",       enter: null,        leave: null },
            { state: "booted",     enter: "boot",      leave: "shutdown" },
            { state: "latched",    enter: "latch",     leave: "unlatch" },
            { state: "configured", enter: "configure", leave: "reset" },
            { state: "prepared",   enter: "prepare",   leave: "release" },
            { state: "started",    enter: "start",     leave: "stop" }
        ])

        /*  define module groups  */
        kernel.groups([ "BOOT", "BASE", "RESOURCE", "SERVICE", "USECASE" ])

        /*  execute extensions on microkernel  */
        await kernel.exec("microkernel-ext-co")
        if (process.env.DEBUG)
            await kernel.exec("microkernel-ext-debug")

        /*  determine system paths  */
        const syspath = SysPath({ appName: options.app })
        kernel.rs("syspath", syspath)

        /*  load extensions and modules into microkernel  */
        kernel.load(
            "microkernel-mod-ctx",
            [ "microkernel-mod-options", { inifile: options.ini } ],
            "microkernel-mod-logger",
            "microkernel-mod-daemon",
            "microkernel-mod-title",
            "microkernel-mod-shutdown",
            ...(options.modules)
        )

        /*  startup microkernel and its modules  */
        return kernel.state("started").then(() => {
            kernel.publish("app:start:success")
            latching.hook("boot-leave", "none", null)
        }).catch((err) => {
            kernel.publish("app:start:error", err)
            latching.hook("boot-leave", "none", err)
            throw err
        })
    }

    /*  the shutdown API method  */
    static async shutdown () {
        /*  shutdown microkernel and its modules  */
        latching.hook("shutdown-enter", "none")
        return kernel.state("booted").then(() => {
            kernel.publish("app:start:success")
            latching.hook("shutdown-leave", "none", null)
            kernel = null
        }).catch((err) => {
            kernel.publish("app:start:error", err)
            latching.hook("shutdown-leave", "none", err)
            kernel = null
            throw err
        })
    }
}

