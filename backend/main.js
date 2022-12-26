const { app, BrowserWindow, ipcMain, protocol, desktopCapturer } = require("electron");
const path = require("path");
const url = require("url");

const { MainWindow } = require("./LoadWindows");

const window = new MainWindow();

app.whenReady().then(() => window.createWindow());

// exports.MainWindow = MainWindow;