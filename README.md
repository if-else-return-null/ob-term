# ob-term
Node.js script and configurations for an omnipresent terminal in the Openbox Window Manager.

With the information and code here to you can setup a script that allows you  
to hide/show/move/resize a terminal emulator by way of keyboard shortcuts.



### Dependencies
 * Linux running an xserver (pretty sure this won't work with Wayland)
 * Node.js installed
 * Terminal Emulator   
 I use the Terminator app in this example but you should be able to substitute  
 any emulator that allows you to set the title of its window.
 * `xrandr`  Used to get monitor geometry
 * `wmctrl`  The program does pretty much all the work here (hide/show/move/resize)


I created this for use in openbox but it will probably work with other widow managers  
as long as `wmctrl` works properly and you can define global keyboard shortcuts.

### Installation
You can get this code with `npm` , `git clone`, or by downloading the zip archive


`git clone https://github.com/if-else-return-null/ob-term.git`  
`npm install https://github.com/if-else-return-null/ob-term.git`  
`wget https://github.com/if-else-return-null/ob-term/archive/main.zip`
