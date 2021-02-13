#!/usr/bin/env node
const { fork , spawn  } = require('child_process');
const fs = require('fs')

let args = process.argv
//console.log(process.env.USER);
let term_app = "terminator"
let term_title = "ob_term_omni"
let geometry = "--geometry=600x600+660+0"

let datafile = "/tmp/ob_term_omni.json"
let customfile = `/home/${process.env.USER}/.config/ob_term_custom.json`
let data = null
let custom = {
    "_1":{x:100,y:100,w:600,h:600},
    "_2":{x:200,y:200,w:300,h:300}
}
function saveData() {
    fs.writeFileSync(datafile, JSON.stringify(data))
}
function saveCustom() {
    fs.writeFileSync(customfile, JSON.stringify(custom))
}

// read or create the data file

if (fs.existsSync(datafile)) {
    console.log(`Found ${datafile}`);
    data = JSON.parse(fs.readFileSync(datafile))
    checkArgs()
} else {
    console.log(`Creating  ${datafile}`);
    update_display_size = false
    data = {
        visible:true,
        mtype:"center",
        /*x:660,
        y:0,
        w:600,
        h:800,*/
        screen:null,
        matrix:{

        }

    }
    getScreenSizes()

}

// check for cmd line options

function checkArgs() {
    args.forEach((item, i) => {
        // use alternate config location (cli and fork only)
        if (item === "-h" ) { showHelp() }
        // add new identity
        if (item === "-ss" ) { probeForWindow() } //show|start|hide
        if (item === "-up" ) { moveWindow("up") }
        if (item === "-down" ) { moveWindow("down") }
        if (item === "-left" ) { moveWindow("left") }
        if (item === "-right" ) { moveWindow("right") }
        if (item === "-custom" ) { moveWindow("custom") }
        if (item === "-save" ) { setCustomGeometry(args[i+1]) }


        if (item === "-info" ) {showStatus() }

    });

    // default to -ss when no options are supplied
    if (args.length === 2) {
        probeForWindow()
    }
    //console.log("ob-term hello", args.length);
}



function showHelp() {
    console.log("ob-term Help Info");
}

function showStatus() {
    console.log(`ob-term Status: `, data);
    getScreenSizes(true)

}


// xrandr --current | grep "*+"
function getScreenSizes(log = false) {
    let databuf = ""
    let probespawn = spawn("sh", ["-c","xrandr --current | grep '*+'" ])
    probespawn.stdout.on('data', (data) => { databuf += data });
    probespawn.stderr.on('data', (data) => { console.log("stderr",data.toString());});
    probespawn.on('exit', (code) => {
      //console.log(`probespawn exited with code ${code}`);
      //
      let s = databuf.trim().split("\n")
      s.forEach((item, i) => {
          s[i] = item.trim().split(" ")
          s[i] = s[i][0].trim().split("x")
      });
      data.screen = s

      setSizeMatrix(log)

    });

}

function setSizeMatrix(log = false) {
    // check for custom sizes config
    if (fs.existsSync(customfile)){
        custom = JSON.parse(fs.readFileSync(customfile))
    } else {
        saveCustom()
    }
    let sw = parseInt( data.screen[0][0] )
    let sh =  parseInt( data.screen[0][1] )
    data.sh = sh,
    data.sw = sw,

    data.matrix = {

        maximized:{x:0,y:0,w:sw,h:sh},
        center:{x:(sw/3),y:0,w:(sw/3),h:(sh*.75)},
        left_half:{x:0,y:0,w:(sw/2),h:sh},
        right_half:{x:(sw/2),y:0,w:(sw/2),h:sh},
        top_half:{x:0,y:0,w:sw,h:(sh/2)},
        bottom_half:{x:0,y:(sh/2),w:sw,h:(sh/2)},
    }
    // set customs in matrix
    let custct = 0
    for (let num in custom) {
        custct += 1
        data.matrix["custom"+num] = custom[num]
    }
    data.custct = custct
    saveData()
    if (log === true) {
        console.log(data);
    } else {
        checkArgs()
    }


}

function setCustomGeometry(id) {
    let num = id
    id = "custom_"+id
    if (!data.matrix[id]){
        console.log("custom geometry id does not exist", id);
        return
    }
    if (data.visible === false) {
        console.log("window must be visible to set custom size");
        return
    }

    let databuf = ""
    let probespawn = spawn("wmctrl", ["-lG"])
    probespawn.stdout.on('data', (data) => { databuf += data });
    probespawn.stderr.on('data', (data) => { console.log("stderr",data.toString());});
    probespawn.on('exit', (code) => {
      //console.log(`probespawn exited with code ${code}`);
      //console.log(databuf);
      let parts = null
      databuf.trim().split("\n").forEach((item, i) => {
          if (item.includes(term_title)){
              parts = item.trim().replace(/\s\s+/g, ' ').split(" ")
          }
      });
      if (parts !== null) {
         // let winid = parts.shift()
          //let
          //let title = parts.pop()
          //let hostname = parts.pop()
          console.log(parts);

          custom["_"+num] = { x:parseInt(parts[2]),y:parseInt(parts[3]),w:parseInt(parts[4]),h:parseInt(parts[5])},
          data.matrix[id] = custom["_"+num]
          console.log(custom);
          saveData()
          saveCustom()
      } else {
          console.log("ob-term is not running");
      }

    });
}

function probeForWindow() {
    let databuf = ""
    let probespawn = spawn("wmctrl", ["-l"])
    probespawn.stdout.on('data', (data) => { databuf += data });
    probespawn.stderr.on('data', (data) => { console.log("stderr",data.toString());});
    probespawn.on('exit', (code) => {
      //console.log(`probespawn exited with code ${code}`);
      //console.log(databuf);
      if (databuf.includes(term_title)) {
          //console.log("found termapp");
          if (data.visible === true) {
              //hide window
              hideWindow()
          } else {
              //show window
              showWindow()
          }
      } else {
          data.visible = true
          saveData()
          launchWindow()
      }

    });

}


function launchWindow() {
    console.log("Launching TermApp");
    let cords = data.matrix[data.mtype]
    let geo = `--geometry=${cords.w}x${cords.h}+${cords.x}+${cords.y}`
    //console.log(geo);
    let openapp = spawn(term_app,[ "-T", "ob_term_omni", geo ])
    openapp.on('exit', (code,signal) => {
        //console.log('openapp process exited',code,signal );
    });
}

function moveWindow(dir) {

    if (dir === "up") {
        if (data.mtype === "top_half") {
            // go maximized
            data.mtype = "maximized"
        } else {
            // go top half
            data.mtype = "top_half"
        }
    }
    else if (dir === "down") {
        if (data.mtype === "bottom_half") {
            // go center
            data.mtype = "center"
        } else {
            // go bottom_half half
            data.mtype = "bottom_half"
        }
    }
    else if (dir === "left") {
        data.mtype = "left_half"

    }
    else if (dir === "right") {
        data.mtype = "right_half"
    }

    else if (dir === "custom") {
        let custcur = 1
        if (data.mtype.includes("custom_")){
            custcur = parseInt(data.mtype.replace("custom_", ""))
            if (custcur === data.custct) {
                custcur = 1
            } else {
                custcur += 1
            }
        }
        data.mtype = "custom_"+custcur

    }

    saveData()
    let cords = data.matrix[data.mtype]
    let moveapp = spawn("wmctrl",[ "-r", "ob_term_omni", "-e", `0,${cords.x},${cords.y},${cords.w},${cords.h}` ])
    //'g,x,y,w,h'
    moveapp.on('exit', (code,signal) => {
        console.log('moveapp process exited',code,signal );
        if (code !== 0) {
            console.log("no window to move launching app");
            launchWindow()
            return
        }
        if (data.visible === false){
            showWindow()
        }

    });
}

function hideWindow() {
    data.visible = false
    saveData()
    let hideapp = spawn("wmctrl",[ "-r", "ob_term_omni", "-e", `0,-1,-${data.sh},-1,-1`/*, "-b", "add,shaded"*/ ])
    //'g,x,y,w,h'
    hideapp.on('exit', (code,signal) => {
        console.log('hideapp process exited',code,signal );
        let shadeapp = spawn("wmctrl",[ "-r", "ob_term_omni", "-b", "add,shaded" ])
    });
}

function showWindow() {
    data.visible = true
    let cords = data.matrix[data.mtype]
    saveData()
    let unshadeapp = spawn("wmctrl",[ "-r", "ob_term_omni", "-b", "remove,shaded"])
    unshadeapp.on('exit', (code,signal) => {
        console.log('unshadeapp process exited',code,signal );
        let showapp = spawn("wmctrl",[ "-r", "ob_term_omni", "-e", `0,-1,${cords.y},-1,-1` ])
        showapp.on('exit', (code,signal) => {
            console.log('showapp process exited',code,signal );
            let focusapp = spawn("wmctrl",[ "-a", "ob_term_omni"  ])
        });
    });
}
