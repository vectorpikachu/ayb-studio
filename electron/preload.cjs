"use strict";

const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("aybDesktop", {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  },
});
