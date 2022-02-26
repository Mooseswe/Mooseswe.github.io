/**
 * YT Channel Videos
 * By Spiralio
 * 
 * HOW TO USE
 * 
 * Copy all of this code into the console of a channel's video
 * tab. The results will be displayed in a page.
 */


// SETTINGS

// This is how long the program should wait for more videos to pop
// up when scrolling (in ms). Set this to a higher value on slower
// internet.
let scrollWait = 1000

// See the README.md for instructions on getting a YT API key
let ytAPIKey = 'API_KEY'

// For testing and debugging
let verbose = false

// SCRIPT

// Initial function
function main() {
    console.log('%cYT Channel Vid Fetcher by Spiralio', 'font-size: 12pt; color: lightseagreen; font-weight: bold')

    if (!window.location.href.endsWith('/videos')) return error('You must be on the videos page to use this!')

    console.log(`%cStep 1: %cScrolling through videos`, 'font-weight: bold; color: skyblue', '')

    let scrollable = document.querySelector('#page-manager')
    let scrollDelay

    let ro;
    function scrollDown() {
        if (scrollDelay) clearTimeout(scrollDelay)

        window.scrollTo(0,scrollable.scrollHeight);

        if (verbose) console.log('Scrolling')
        scrollDelay = setTimeout(() => {
            ro?.disconnect()
            console.log('%cScroll stop detected', 'color: lightseagreen')

            getVideos()

        }, scrollWait)
    }
    scrollDown()

    ro = new ResizeObserver(scrollDown).observe(scrollable) // Updates whenever the scroll window changes height
}
main()

// Get the videos on the page
function getVideos() {
    console.log(`%cStep 2: %cAdding all videos to a list`, 'font-weight: bold; color: skyblue', '')

    let videos = document.querySelector('div#items.style-scope.ytd-grid-renderer').querySelectorAll('#thumbnail')

    let vidIDs = []
    for (i = 0; i < videos.length; i++) {
        let vid = videos[i]
        let vidID = vid.href.split('?v=')[1].split('&')[0]
        if (vid.href) vidIDs.push(vidID)

        if (verbose) console.log(`Found video with ID ${vidID}`)
    }

    console.log(`%cFound ${videos.length} video${videos.length == 1 ? '' : 's'}`, 'color: lightseagreen')

    ytAPI(vidIDs)
}

// Get videos with the YT API
function ytAPI(vids) {

    console.log(`%cStep 3: %cUsing the YouTube API to get video info`, 'font-weight: bold; color: skyblue', '')

    let videoSets = []

    while(vids.length)
        videoSets.push(vids.splice(0,50));

    console.log(`%c${videoSets.length} set${videoSets.length == 1 ? '' : 's'} are being sent`, 'color: lightseagreen')

    let results = []

    let setNum = 0;
    function getVidSet() {
        let url = `https://www.googleapis.com/youtube/v3/videos?key=${ytAPIKey}&part=snippet%2Cstatistics&id=`
        url += videoSets[setNum].join('%2C')
    
        if (verbose) console.log(`GET ${url}`)
    
        httpGet(url).then((res) => {
            if (res) results = results.concat(res.items)

            if (res.items && verbose) console.log(`Item amount: ${res.items.length}`)

            setNum++
            if (setNum < videoSets.length) getVidSet()
            else formatResults(results)
        }).catch((status) => error(`The call to the YouTube API didn't work, returned status ${status}`))

    }

    getVidSet()
}

function formatResults(results) {
    console.log(`%cStep 4: %cFormatting results`, 'font-weight: bold; color: skyblue', '')

    let final = []

    for (i = 0; i < results.length; i++) {
        let info = results[i].snippet
        let stats = results[i].statistics

        let thumbnailOpts = Object.keys(info.thumbnails)
        let thumbnail = info.thumbnails[thumbnailOpts[thumbnailOpts.length - 1]]

        final.push({
            title: info.title,
            id: info.id,
            date: info.publishedAt,
            thumbnail: thumbnail.url,
            views: stats.viewCount
        })
    }

    stringWindow(
        `<head>
            <script>
                function copy() {
                    let text = document.getElementById("json")
                    navigator.clipboard.writeText(text.innerHTML)
                }
            </script>
            <title>Video List</title>
            <style>
                button {
                    padding: 10px;
                    border: 1px solid #515151;
                    border-radius: 5px;
                    margin-left: 10px;
                    background-color: #333333;
                    display: inline-block;
                    color: white;
                    vertical-align: center;
                    transform: translateY(-5px)
                }

                button:hover {
                    background-color: #404040;
                }

                button:active {
                    background-color: #46A81F;
                }
            </style>
        </head>
        <body style="background-color: #252527; color: white; font-family: Arial">
            <h1 style="margin: 20px 0 0 10px; display: inline-block">Video List (${final.length} video${final.length == 1 ? '' : 's'})</h1>
            <button onclick="copy()">Copy to Clipboard</button>
            <pre style="padding: 20px; background-color: #1E1E1E; border-radius: 10px; color: #9CDCFE; border: 1px solid #515151">
                <code id="json">${JSON.stringify(final, null, 4)}</code>
            </pre>
        </body>`.replaceAll('   ','')
    )
}

// UTIL FUNCTIONS

// Send an error message
function error(e) {
    console.log(`%cError: %c${e}`, 'font-weight: bold; color: red;', 'color: tomato')
}

// Create a new window with a string
function stringWindow(html) {
    let newWindow = window.open("about:blank", "", "_blank");
    newWindow.document.write(html);
}

// Make an HTTP get request
function httpGet(url) {
    return new Promise((resolve, reject) => {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = () => { 
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
                return resolve(JSON.parse(xmlHttp.responseText));
            else if (xmlHttp.readyState == 4) reject(xmlHttp.status)

        }
        xmlHttp.open("GET", url, true);
        xmlHttp.send(null);
    })
}