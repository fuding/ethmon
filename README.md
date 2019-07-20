# ethmon
Claymore's GPU Miner and Ethminer nodejs-based web monitoring utility.  
Simple web application for monitoring for **Ethash-based coins mining ONLY**. It provides monitoring of your ETH rigs with your wallet balance and how much is that in USD based on the current maket value (currently only for ETH).   
Claymore's GPU Miner: [https://bitcointalk.org/index.php?topic=1433925](https://bitcointalk.org/index.php?topic=1433925)
Ethminer: [https://github.com/ethereum-mining/ethminer](https://github.com/ethereum-mining/ethminer)
This is a fork of [shkabo/ethmon](https://github.com/osnwt/ethmon) with my own additions:
- Coins with ETC-based explorers support
- Network difficulty from explorer
- Email notifications if some rig is offline or low hashrate
- "Connect" button support for each rig. [Shellinabox](https://github.com/shellinabox/shellinabox) URL can be used for this button. If your rig is running Windows you can use "rdp://" hyperlink to start RDP session from the browser. [More info](https://docs.microsoft.com/en-us/windows-server/remote/remote-desktop-services/clients/remote-desktop-uri)
- GPU numbering and other minor improvements

![alt text](https://github.com/platofff/ethmon/raw/master/screenshot.png "screenshot")  

## Installation from Docker
```
docker pull systemdplatoffd/ethmon
docker run -p 3000:3000 -p 3001:3001 -v /host/path/to/config.json:/config/config.json systemdplatoffd/ethmon
```
## Installation
* Install [nodejs 8+ and npm](http://nodejs.org) for your system (tested on MacOSX, Ubuntu and Windows)
* Clone this repository or download and extract files
* Change to the top directory of the package
* Install dependencies ```npm install```
* Copy ```config.json.sample``` to ```config.json``` and edit where necessary (see **CONFIG.md** for detailed comments and optional parameters)
* Start the application ```npm start```
* Open web browser to [localhost:3000](localhost:3000) (or your IP:3000)
* Enjoy
### Notes
1. If you are going to use this monitoring with ETC based coins and dynamic DNS services like KeenDNS (only port 80 is available for external connection) you should register domain names for internal ports 3000 and 3001 and put a domain name for port 3001 in config.json (Let's encrypt certificate enabled):
```"cors_anywhere_host": "https://subdomain.domain.keenetic.xx"```
2. If you need to open monitoring webpage ports for the Internet you should declare ```CORSANYWHERE_RATELIMIT``` variable. [More info](https://github.com/Rob--W/cors-anywhere/blob/2ee31471ce3b624b5503bcc9c62fbe6783192c45/README.md#demo-server)

## Known issues
* On some Ubuntu releases after ```apt-get install npm``` the node interpreter is called **nodejs** due to conflict with some other package. In that case you may need to replace ```node ./www/www.js``` by ```nodejs ./www/www.js``` in ```package.json``` file or better create a link from /usr/local/node to the nodejs binary 

## :+1: the app ? Why not support it
If you want to send me some digital gold: 
* BTC: 1DtJutLDmH1MzY7Ew36ziLPp3YNuwXpvfb

If you want to donate to the initial author of ethmon [@osnwt](https://github.com/osnwt), you can do it on :
- BTC: removed by @osnwt as non-actual
- ETH: removed by @osnwt as non-actual

¯\_(ツ)_/¯
