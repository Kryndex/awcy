const {app, BrowserWindow, Menu} = require('electron')
const argparse = require('argparse')
const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

var parser = new argparse.ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'AOM Analyzer'
});

parser.addArgument(['--frames'], { defaultValue: 4, help: 'Number of frames to decode.' });
parser.addArgument(['file'], { nargs: '+', help: 'Decoder or IVF file.' });
var cliArgs = parser.parseArgs();

if (!cliArgs.file[0].endsWith(".js")) {
  console.log('\x1b[33m%s\x1b[0m', "First argument must be a decoder.");
  process.exit();
}

function createWindow() {
  function resolveProtocol(x) {
    if (x.startsWith("http")) {
      return x;
    }
    return "file://" + path.resolve(x);
  }
  var mainScreen = require('electron').screen.getPrimaryDisplay();
  var dimensions = mainScreen.size;
  var width = 800;
  var height = 600;
  // Stats:
  //  31% > 1920x1080
  //  17%	= 1920x1080
  //  35%	= 1366x768
  //   5% = 1280x1024
  //   4% = 1280x800
  //   3% = 1024x768
  // 4.4% < 1024x768
  if (dimensions.width >= 1680 && dimensions.height >= 1050) {
    width = 1366;
    height = 768;
  }

  win = new BrowserWindow({ width, height })
  let files = cliArgs.file.map(x => {
    if (x.endsWith(".js")) {
      return `decoder=${resolveProtocol(x)}`;
    } else if (x.endsWith(".ivf")) {
      return `file=${resolveProtocol(x)}`;
    } else {
      console.log('\x1b[33m%s\x1b[0m', `Unknown file type ${x}.`);
      process.exit();
    }
    return x;
  }).join("&");

  let search = `?maxFrames=${cliArgs.frames}&` + files;
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'analyzer.html'),
    protocol: 'file:',
    slashes: true,
    search: search
  }));

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// Remove Menu
Menu.setApplicationMenu(Menu.buildFromTemplate([]));
