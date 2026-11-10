/* Ghostscript trial runner (AGPL-3.0, see /about for source).
 * A classic worker on purpose: the Emscripten glue needs importScripts and
 * cannot start inside a module worker or a webpack bundle. One trial per worker;
 * the caller terminates the worker afterwards so WASM memory is released. */
var total = 0;
/* This Ghostscript build ignores the Module.print option and writes to console.log, which it
 * binds when the glue loads. So we replace console.log BEFORE importScripts and read the
 * page progress lines from it ("Processing pages 1 through N." then "Page k"). */
console.log = function (line) {
  line = String(line);
  var m = /Processing pages \d+ through (\d+)/.exec(line);
  if (m) total = +m[1];
  m = /^Page (\d+)/.exec(line);
  if (m) postMessage({ progress: true, page: +m[1], total: total });
};
console.warn = console.error = function () {};
importScripts("/gs/gs.js");

self.onmessage = function (e) {
  var data = e.data;
  Module({
    noInitialRun: true,
    print: console.log,
    printErr: function () {},
    locateFile: function (f) {
      return f.slice(-5) === ".wasm" ? "/gs/gs.wasm" : "/gs/" + f;
    },
  })
    .then(function (mod) {
      mod.FS.mkdir("/work");
      mod.FS.writeFile("/work/in.pdf", new Uint8Array(data.input));
      try {
        mod.callMain(data.args);
      } catch (err) {
        /* Emscripten throws ExitStatus when main exits; the output file is the real result. */
      }
      var out = null;
      try {
        out = mod.FS.readFile("/work/out.pdf");
      } catch (err) {}
      if (!out || !out.length) {
        postMessage({ ok: false, error: "Ghostscript produced no output" });
        return;
      }
      var copy = new Uint8Array(out);
      postMessage({ ok: true, bytes: copy }, [copy.buffer]);
    })
    .catch(function (err) {
      postMessage({ ok: false, error: String((err && err.message) || err) });
    });
};
