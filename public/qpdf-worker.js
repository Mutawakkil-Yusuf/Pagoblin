/*
 * qpdf WASM worker (classic worker, no bundler).
 *
 * The main thread builds the qpdf argument list (see lib/engine/impl/qpdf.ts)
 * and sends it with the PDF bytes. Everything stays in memory; the worker is
 * terminated after one job, which releases the WASM heap.
 *
 * qpdf is Apache-2.0. Source: https://github.com/jsscheller/qpdf-wasm
 */
/* eslint-disable no-undef */
self.exports = {};
importScripts("/qpdf/qpdf.js");

var qpdfFactory = self.exports.Module;
delete self.exports;

var cancelled = false;

self.onmessage = async function (event) {
  var data = event.data || {};
  var logs = [];
  try {
    var qpdf = await qpdfFactory({
      locateFile: function (path) {
        return "/qpdf/" + path;
      },
      print: function () {},
      printErr: function (line) {
        logs.push(String(line));
      },
    });
    if (cancelled) throw new Error("canceled by job");
    var input = data.input;
    if (input && typeof input.arrayBuffer === "function") input = await input.arrayBuffer();
    qpdf.FS.writeFile("/in.pdf", new Uint8Array(input));
    self.postMessage({ progress: true, label: data.mode === "protect" ? "Locking" : "Unlocking" });
    var code = qpdf.callMain(data.args || []);
    if (cancelled) throw new Error("canceled by job");
    if (code !== 0) {
      throw new Error(logs.join("\n") || "qpdf exited with code " + code);
    }
    var bytes = qpdf.FS.readFile("/out.pdf");
    if (!bytes || !bytes.byteLength) throw new Error("qpdf produced an empty file");
    self.postMessage({ ok: true, bytes: bytes }, [bytes.buffer]);
  } catch (error) {
    self.postMessage({ ok: false, error: String((error && error.message) || error) });
  }
};

self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "cancel") cancelled = true;
});
