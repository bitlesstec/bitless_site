
let minCanvasWidth = 640;
let minCanvasHeight = 360;
let isLoadingProject = false;

const metadata = {
    name: "tilered",
    version: "0.0.0",
    url: "https://gitlab.com/pavul/texturepacker"
}

const bgPatternsImg = ["/img/pattern/gray.png", "/img/pattern/white.png", "/img/pattern/black.png"];

// const imageName = "texture_atlas.png";
const FILE_NAME = "tilerer";

let imgIdCounter = 0;
let layerIdCounter = 0;
let areaIdCounter = 0;

let tilesetList = [];
let layerList = [];
let areaList = [];

const canvas = document.getElementById("canvas");
let ctx = undefined;

const tilesetCanvas = document.getElementById("tilesetCanvas");
let tilesetCtx = undefined;

let patternImg = undefined;
let gridColor = undefined;

let tsGridColor = undefined;

let bgSet = undefined;
let highlightIdSet = -1;
// let canvasWidth = undefined;
// let canvasHeight = undefined;
scaleSet = 1;
tilesetScale = 1;

//used to stablish the pivox x, y
//when an image will be dragged
let selectImgX = 0;
let selectImgY = 0;
let imgIdSelected = -1;
let areaIdSelected = -1;

//default grid, rows & cols values
const LYR_DEF_GRIDW = 32;
const LYR_DEF_GRIDH = 32;

let LYR_DEF_ROWS = calculateCells(canvas.width, LYR_DEF_GRIDW);
let LYR_DEF_COLS = calculateCells(canvas.height, LYR_DEF_GRIDH);

let tileSelected = undefined;
let clickPressed = false;

let isGridVisible = true;
let isPainting = true;
let tilePressed = {
    "initX": 0,
    "initY": 0,
    "presed": false
}


let isTilesetGridVisible = true;

modalOpen = false;


document.addEventListener("DOMContentLoaded", function () {

    ctx = canvas.getContext('2d');
    tilesetCtx = tilesetCanvas.getContext('2d');

    //paint tileset canvas in black
    tilesetCtx.fillStyle = "#000";
    tilesetCtx.fillRect(0, 0, 128, 128);

    //setting pattern first time
    // loadImg(bgPatternsImg[0]).then(img => {
    //     patternImg = img;
    //     setCanvasBg();

    //     //draw grid here after pattern image is loaded 
    //     //for first time
    //     drawGrid(ctx, canvas, layerList[0].gridW, layerList[0].gridH, scaleSet, gridColor);

    // });
   


    //when tilesets are loaded
    document.getElementById('upload-files').
        addEventListener('change', (event) => {
            const fileList = event.target.files;
            console.log("setting bg loading imgs (tilesets): ", fileList.length);
            loadFiles(fileList);
        });

    window.onbeforeunload = function () {
        return 'Are you sure you want to leave?, progress will be lost.';
    };

    window.addEventListener("keyup", (e) => {
        if (!modalOpen) {

            //hide/show layers grid
            if (e.key === ";" && e.ctrlKey) {
                changeGridVisibility();
            }
            else if (e.key === "'" && e.ctrlKey) {
                changeTilesetGridVisibility();
            }
            else {
                // console.log("calling keyup: "+e.key)
                switch (e.key.toLowerCase()) {
                    case 'b'://select brush
                        setPainting(true);
                        break;
                    case 'e'://select eraser
                        setPainting(false);
                        break;
                    case 'r':
                        resetLayer();
                        break;

                    //@todo add shorcut for layer, tileset, area settings? what else
                }
            }

        }

    });

    //scale on mouse wheel scroll
    canvas.addEventListener("mousewheel",
        (e) => {
            e.preventDefault();

            scaleSet = getScale(e, scaleSet);
            scaleCanvas(scaleSet);
            document.querySelector("#scaleSel").value = scaleSet;
        }
    );

    //to click on canvas and select images with click
    canvas.addEventListener("mouseup", (e) => {
        clickPressed = false;
    });

    //for dragging image and change position
    canvas.addEventListener("mousedown", (e) => {
        clickPressed = true;
        putTileOnMap(e);
    });

    canvas.addEventListener("mousemove", (e) => {

        if (clickPressed) { putTileOnMap(e); }
        else {
            setCanvasBg(bgSet);
            dragTile(e);
            drawLayers();
            const layerId = parseInt(document.querySelector("#layerSelected").value)

            if (isGridVisible)
                drawGrid(ctx, canvas, layerList[layerId - 1].gridW, layerList[layerId - 1].gridH, scaleSet, gridColor);
        }

    });


    const lyrId = ++layerIdCounter;
    const lyrName = "layer1";
    layerList.push({
        "id": lyrId,
        "name": lyrName,
        "map": initMapArray(canvas, LYR_DEF_GRIDW, LYR_DEF_GRIDH),
        "gridW": LYR_DEF_GRIDW,
        "gridH": LYR_DEF_GRIDH,
        "cols": LYR_DEF_COLS,
        "rows": LYR_DEF_ROWS,
        "visibility": true,
        "opacity": 1,
        "frames": []
    })

    //setting bg and grid after setting first default layer:
    setCanvasBg();
    drawGrid(ctx, canvas, layerList[0].gridW, layerList[0].gridH, scaleSet, gridColor);

    const tmplt = getLayerItemTemplate(lyrId, lyrName);
    document.querySelector("#layerList").insertAdjacentHTML('beforeend', tmplt);
    document.querySelector(`#layer_itm_list_${lyrId}`).classList.add("active");

    // $("#layerList").append(tmplt);
    // $(`#layer_itm_list_${lyrId}`).addClass("active")

    tilesetCanvas.addEventListener("mousewheel",
        (e) => {
            e.preventDefault();
            let tilesetId = parseInt(document.querySelector("#tilesetSelected").value);
            if (tilesetId === 0) return;

            // console.log("entering TILESET CANVAS SCALE")
            tilesetScale = getScale(e, tilesetScale);
            scaleTileset();
            document.querySelector("#tilesetScaleLabel").innerHTML = tilesetScale;
        });


    tilesetCanvas.addEventListener("mousemove",
        (e) => {
            if (tilePressed.presed) selectTile(e);
        });

    tilesetCanvas.addEventListener("mouseup",
        (e) => {

            selectTile(e);
            tilePressed.presed = false;//this is important to be here below selectTile
        });

    //to get initial x & y coordinates
    tilesetCanvas.addEventListener("mousedown",
        (e) => {
            pressTile(e);
        });

    setGridColor();

});//doc ready


/**
 * will set canvas pattern or color
 */
function setCanvasBg(value) {

    const bgColorPicker = document.querySelector("#bgColorPicker");

    ctx.fillStyle = bgColorPicker.value;

    // bgSet = value;
    // // console.log( "setCanvasBg::bgSet ", value )
    // switch (value) {
    //     case "pattern":
    //         // default:
    //         ctx.fillStyle = ctx.createPattern(patternImg, "repeat");
    //         break;
    //     case "gray": ctx.fillStyle = "#cccccc";
    //         break;
    //     case "white": ctx.fillStyle = "#FFFFFF";
    //         break;
    //     case "black": ctx.fillStyle = "#000000";
    //         break;
    // }

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // setHighlightColor( highlightIdSet )
}

function setCanvasWidth(newWidth) 
{
    // console.log(newWidth)
    canvas.width = newWidth;
    // canvas.style.width = newWidth + 'px';

    for (const lyr of layerList) {
        lyr.map = initMapArray(canvas, lyr.gridW, lyr.gridH);
        console.log("new canvas cols: ", (canvas.width / scaleSet) / lyr.gridW)
        lyr.cols = calculateCells(canvas.width / scaleSet, lyr.gridW);
    }

    scaleCanvas(scaleSet);
    setCanvasBg(bgSet);
    drawLayers();
    if (isGridVisible) {
        const layerId = parseInt(document.querySelector("#layerSelected").value);
        drawGrid(ctx, canvas, layerList[layerId - 1].gridW, layerList[layerId - 1].gridH, scaleSet, gridColor);
    }
}


function setCanvasHeight(newHeight) {
    // console.log(newHeight)
    canvas.height = newHeight;

    // canvas.style.height = newHeight + 'px';

    for (const lyr of layerList) {
        // console.log("new canvas rows: ",(canvas.height / scaleSet)/ lyr.gridH )
        lyr.rows = calculateCells(canvas.height / scaleSet, lyr.gridH);
        lyr.map = initMapArray(canvas, lyr.gridW, lyr.gridH);
    }

    // console.log(" canvas height: ", bgSet)
    scaleCanvas(scaleSet);
    setCanvasBg(bgSet);
    drawLayers();
    if (isGridVisible) {
        const layerId = parseInt(document.querySelector("#layerSelected").value);
        drawGrid(ctx, canvas, layerList[layerId - 1].gridW, layerList[layerId - 1].gridH, scaleSet, gridColor);
    }
}

function triggerUploadImgs() {
    //const iploadImgs = 
    // $("#upload-img").trigger('click');
    const fileInput = document.getElementById("upload-files");
    fileInput.click();
}


/**
 * this load images retrieved from input=file element, 
 * and put those image files in the list.
 * Each image here is a tileset
 * @param {} fileList 
 */
async function loadFiles(fileList) {


    if (isLoadingProject) {
        console.log("loading project")

        let jsonData = undefined;
        let pngCounter = 0;
        for (const file of fileList) {
            console.log(file.name)
            if (getFileType(file.name) === 'json') {
                console.log("loading project is json:")

                jsonData = await new Promise((res, rej) => {
                    const fileReader = new FileReader();
                    fileReader.onload = event => { console.log(event.target.result); res(JSON.parse(event.target.result)) }
                    fileReader.onerror = error => rej(error)
                    fileReader.readAsText(file);
                    // fileReader.onload = function(e)
                    // {
                    //     const content = e.target.result;
                    //     console.log("jsonloaded: ", conmtent);
                    //     res(JSON.parse( content ));
                    // }
                });


                // console.log("--- LOADED PROJECT JSON DATA ---");
                // console.log(jsonData);
                // break;
            }
            else {
                pngCounter++;
            }
        }//for

        if (jsonData !== undefined) 
        {

            //  setCanvasWidth(jsonData.levelWidth)
            //  setCanvasHeight(jsonData.levelHeight)

            document.querySelector("#cvWidth").value = jsonData.levelWidth;
            document.querySelector("#cvHeight").value = jsonData.levelHeight;
            canvas.width=jsonData.levelWidth
            canvas.height=jsonData.levelHeight
            

            tilesetList = jsonData.tilesets;
            layerList = jsonData.layers;
            areaList = jsonData.areas;

            let pngLoaded = 0;
            //adding img elements to tilesets list
            for (const file of fileList) {
                // console.log("loading proy img: ",file.name )

                //iterate only for png images
                if (getFileType(file.name) !== "png") continue;

                const fileReader = new FileReader();
                fileReader.onload = function (e) {
                    // console.log("loading img: ",file.name )

                    const img = new Image();
                    img.src = e.target.result;
                    img.onload = () => {

                        pngLoaded++;

                        for (tileset of tilesetList) 
                        {
                            if (file.name.includes(tileset.name)) {
                                // console.log( `includes img: ${file.name} - ${tileset.name}` )
                                tileset.img = img;
                            }

                        }

                        //draw layers afer all images are loaded
                        if (pngCounter === pngLoaded) 
                        {
                            setCanvasBg(bgSet)
                            drawLayers();
                            selectTileset(1);
                            // changeTsGridColor();//this will redraw tileset
                        }

                    }//img load

                }
                fileReader.readAsDataURL(file);
            }//for


            //set the UI from loaded data
            //layers
            let txt = "";
            layerIdCounter=0;//reset layer to 0 cause there is 1 by default
            for (lyr of layerList) 
            {
                console.log(`creating layer: ${lyr.name} - ${lyr.id}`);
                layerIdCounter++;
                txt += getLayerItemTemplate(lyr.id, lyr.name);
            }
            // $("#layerSelected").val(0);
            document.querySelector("#layerList").innerHTML = txt;
            selectLayer(1);


            //tilesets
            let tlsetTxt = "";
            imgIdCounter=0;
            for (tlset of tilesetList) 
            {

                console.log("+++++TILESET added: ", tlset.name)
                imgIdCounter++;
                tlsetTxt += getTilesetTemplate(tlset.id, tlset.name);
            }

            //set by default first tileset if loaded
            if (tlsetTxt !== "") 
            {
                document.querySelector("#tilesetList").innerHTML = tlsetTxt;
                document.querySelector("#tilesetSelected").value = 1;
                document.querySelector("#img_" + 1).classList.add("active")
            }
            //>>>

            //areas
            let areaTxt = "";
            // console.log("areaTxt")
            // console.log(areaTxt)
            areaIdCounter=0;
            for (area of areaList) {
                // area.id = areaIdCounter;
                areaIdCounter++;
                areaTxt += getAreaItemTemplate(area.id, "area" + area.id);
            }

            console.log(areaTxt)
            if (areaTxt !== "") {
                document.querySelector("#areaList").innerHTML = areaTxt;
                // areaIdSelected=-1;
            }


            //finally check for those layerList with null or not defined frames
            //this happens where when the project was downloaded with empty layers
            //stringify sets and object instead of an empty array
            for (lyr of layerList) {
               if( lyr.frames.length === undefined )
               {
                lyr.frames=[];
               }
            }

        }


    }
    else 
    {
        console.log("---------LOADING TILESET")
        for (const file of fileList) {
            if (checkRepeatedImg(file)) continue;
            const fileReader = new FileReader();

            fileReader.onload = function (e) {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {

                    const imgObj =
                    {
                        "id": ++imgIdCounter,
                        "name": file.name.substring(0, file.name.lastIndexOf('.')),
                        "gridW": 32,
                        "gridH": 32,
                        "imgW": img.width,
                        "imgH": img.height,
                        "img": img,
                        "imgType": file.name.substring(file.name.lastIndexOf('.'))
                    }

                    tilesetList.push(imgObj);

                    document.querySelector("#tilesetList").insertAdjacentHTML('beforeend', getTilesetTemplate(imgObj.id, imgObj.name));
                    // $("#tilesetList").append( getTilesetTemplate(imgObj.id, imgObj.name) );

                }

            }

            fileReader.readAsDataURL(file);
        }

    }

    isLoadingProject = false;
}


function getItemTemplate(data) {
    txt = `<li id="list_item_${data.id}" onclick="getData(${data.id})" class="list-group-item" ><span id="list_item_name_${data.id}" >${data.name}</span>  <a href="#" style="float:right;" onclick="removeItem(${data.id})"> <span class="glyphicon glyphicon-trash"></span> </a></li>`;
    return txt;
}

/**
 * returns next Y coordinate position for the new
 * image object
 */
function getY(img) {

    //get maxY of the current list
    let maxY = 0;
    for (let idx = 0; idx < tilesetList.length; idx++) {
        let yx = tilesetList[idx].y + tilesetList[idx].h;
        if (yx >= maxY) maxY = yx;
    }

    return maxY;
}


function toggle(id) {
    highlightIdSet = id;

    setCanvasBg(bgSet);
    //show images here
    changeGridColor();
}

function changeGridColor() {
    const layerId = parseInt(document.querySelector("#layerSelected").value);
    // setCanvasBg(bgSet);
    drawLayers();
    drawGrid(ctx, canvas, layerList[layerId - 1].gridW, layerList[layerId - 1].gridH, scaleSet, gridColor);
}

function changeTsGridColor() {
    // tsGridColor
    const tilesetId = parseInt(document.querySelector("#tilesetSelected").value);
    // setTilesetBg();
    drawTilesetImage();

    if (tilesetList[tilesetId - 1] !== undefined && isTilesetGridVisible)
        drawGrid(tilesetCtx, tilesetList[tilesetId - 1].img, tilesetList[tilesetId - 1].gridW, tilesetList[tilesetId - 1].gridH, tilesetScale, tsGridColor);

}

async function loadImg(url) {
    return await new Promise((resolve) => {
        const img = new Image();
        img.addEventListener('load', () => { resolve(img) });
        img.src = url;
    });
}

/**
this function sets both grid colors for canvas map and tileset
*/
function setGridColor() {
    gridColor = document.querySelector("#gridColor").value;
    tsGridColor = document.querySelector("#tsGridColor").value;
    if (isGridVisible)
        changeGridColor();

    if (isTilesetGridVisible)
        changeTsGridColor();
}

function setTsGridColor() 
{
    tsGridColor = document.querySelector("#tsGridColor").value;
    if (isTilesetGridVisible)
        changeTsGridColor();
}

// function setTSBackgroundColor()
// {
//     >>>
// }


function removeItem(id) {
    maxH = 0;
    counter = 0;
    tilesetList.splice(Number.parseInt(id) - 1, 1);

    for (img of tilesetList) {
        img.id = ++counter;

        // let hx = img.y + img.h;
        // if( hx >= maxH )
        //     maxH = hx;
    }

    //after modifiying list redraw all items everywhere
    // checkImgMeasures()//restore canvas width and height if needed
    setCanvasBg(bgSet);
    drawImgs();

    let itmList = "";
    for (const imgData of tilesetList) {
        itmList += getItemTemplate(imgData);
    }

    document.querySelector("#imageList").innerHTML = itmList;

}


function setFrameWidth(val) {
    const id = parseInt(document.querySelector("#img_sel_id").value);
    tilesetList[id - 1].frameWidth = parseInt(val);

    // console.log("frameWidth set:", val)
    // console.log("img.frameWidth :", tilesetList[id - 1].frameWidth)


    const frames = Math.trunc(tilesetList[id - 1].w / tilesetList[id - 1].frameWidth);

    tilesetList[id - 1].frames = frames;
    document.querySelector("#img_sel_f").value = frames;

    // console.log("final frames set: ", frames)
    // img_sel_f

    // checkImgMeasures();
    setCanvasBg(bgSet);
    drawImgs();
    changeGridColor(id);
}

//XXX
function setImgX(val) {
    const id = parseInt(document.querySelector("#img_sel_id").value);
    tilesetList[id - 1].x = parseInt(val);
    // checkImgMeasures();
    setCanvasBg(bgSet);
    drawImgs();
    changeGridColor();

}

//XXX
function setImgY(val) {
    const id = parseInt(document.querySelector("#img_sel_id").value);
    console.log(`ITEM ID: ${id}`)
    tilesetList[id - 1].y = parseInt(val);
    // checkImgMeasures()
    setCanvasBg(bgSet);
    drawImgs();
    changeGridColor();

}


function downloadCanvasAsImage() {

    scaleCanvas(1);
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawLayers();

    let imgUrl = canvas
        .toDataURL("image/png").replace("image/png", "image/octet-stream");

    saveAs(imgUrl, `${FILE_NAME}.png`)

    scaleCanvas(scaleSet);
    setCanvasBg(bgSet);
    drawLayers()

    const layerId = parseInt(document.querySelector("#layerSelected").value);
    if (isGridVisible)
        drawGrid(ctx, canvas, layerList[layerId - 1].gridW, layerList[layerId - 1].gridH, scaleSet, gridColor);

}


/**
 * transforms all the layers, tilesets and areas into a json object
 * that can be saved with the canvas/level image
 * @returns 
 */
function getProjectJsonData() {
    //extracting null values and just leaving existing tiles
    //in a different array of the same layer
    for (lyrIdx in layerList) {
        const cleanMap = new Array();

        for (cellIdx in layerList[lyrIdx].map) {
            if (layerList[lyrIdx].map[cellIdx] !== null)
                cleanMap.push(layerList[lyrIdx].map[cellIdx])
        }
        layerList[lyrIdx].cleanMap = cleanMap;
    }

    const jsonData = {
        "levelWidth": canvas.width,
        "levelHeight": canvas.height,
        "tilesets": tilesetList,
        "layers": layerList,
        "areas": areaList
    }

    return jsonData;
}

/**
 * this function generates a json files with all the content
 * of layers created.
 * every layer has its own properties:
 * name, cols, rows, tileWidth
 */
function downloadJsonData() {
    let jsonFile = new Blob([JSON.stringify(getProjectJsonData())],
        { type: 'application/javascript;charset=utf-8' });
    saveAs(jsonFile, `${FILE_NAME}.json`)

}

function downloadZip() {
    const zip = new JSZip();
    zip.file("atlas.json", JSON.stringify(tilesetList));
    zip.file("atlas.png", ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer);

    zip.generateAsync({ type: "blob" }).then(content => {
        location.href = "data:application/zip;base64," + content;
        // saveAs( content, "atlas.zip") 
    });
}



/**
 * this function is used to convert img.src to bloc, to
 * download the tilesets in a project
 * @param {*} base64Image 
 * @returns 
 */
function convertBase64ToBlob(base64Image) {
    // Split into two parts
    const parts = base64Image.split(';base64,');

    // Hold the content type
    const imageType = parts[0].split(':')[1];

    // Decode Base64 string
    const decodedData = window.atob(parts[1]);

    // Create UNIT8ARRAY of size same as row data length
    const uInt8Array = new Uint8Array(decodedData.length);

    // Insert all character code into uInt8Array
    for (let i = 0; i < decodedData.length; ++i) {
        uInt8Array[i] = decodedData.charCodeAt(i);
    }

    // Return BLOB image after conversion
    return new Blob([uInt8Array], { type: imageType });
}



async function downloadProject() {
    const zip = new JSZip();

    zip.file("tilered.json", JSON.stringify(getProjectJsonData()));

    // zip.file("level_design.png", ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
    zip.file("level_design.png", canvas.toDataURL("image/png").split(";base64,")[1], { base64: true });


    //set every tileset in the zip
    tilesetList.forEach(tileset => {
        // console.log(tileset.img.src)
        // console.log(tileset.img)

        try {
            zip.file(`${tileset.name}${tileset.imgType}`, convertBase64ToBlob(tileset.img.src), { type: "blob" });
        } catch (error) {
            console.error(error)
        }

    });

    // zip.file("atlas.png", ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer);

    zip.generateAsync({ type: "blob" }).then(content => {
        // location.href = "data:application/zip;base64," + content;
        saveAs(content, "tilered.zip")
    });

}

function scaleCanvas(val) {
    scaleSet = val;

    canvas.width = parseInt(document.querySelector("#cvWidth").value * val);
    canvas.height = parseInt(document.querySelector("#cvHeight").value * val);

    ctx.scale(scaleSet, scaleSet);
    setCanvasBg(bgSet);
    drawLayers();

    const layerId = parseInt(document.querySelector("#layerSelected").value);
    if (isGridVisible)
        drawGrid(ctx, canvas, layerList[layerId - 1].gridW, layerList[layerId - 1].gridH, scaleSet, gridColor);

    // showHighlight( highlightIdSet )
}

function scaleTileset() {
    const tilesetId = parseInt(document.querySelector("#tilesetSelected").value);
    if (tilesetId === 0) return;

    const tls = tilesetList[tilesetId - 1];

    tilesetCanvas.width = tls.img.width * tilesetScale;
    tilesetCanvas.height = tls.img.height * tilesetScale
    tilesetCtx.scale(tilesetScale, tilesetScale);
    setTilesetBg(tilesetId);

    //draw tileset
    tilesetCtx.drawImage(tls.img, 0, 0);

    //draw grid if visible
    if (isTilesetGridVisible)
        drawGrid(tilesetCtx, tls.img, tls.gridW, tls.gridH, tilesetScale, tsGridColor);

}

/**
 * this will check if current file to add to imageList
 * is already in the list, returns true if so
 */
function checkRepeatedImg(file) {

    for (img of tilesetList) {
        if (file.name === img.name) {
            return true;
        }
    }
    return false;
}

function setName(val) {
    const id = parseInt(document.querySelector("#img_sel_id").value);
    tilesetList[id - 1].name = val;

    document.querySelector("#list_item_name_" + id).innerHTML = val;

}

function getMouseCoordinates(e, cnvs) {
    const boundingRect = cnvs.getBoundingClientRect();
    let eX = e.clientX - boundingRect.left;
    let eY = e.clientY - boundingRect.top;

    // eX = Math.trunc(eX/scaleSet)
    // eY = Math.trunc(eY/scaleSet)  

    return { x: eX, y: eY };
}


function getScale(event, scaleVal) {

    if (event.deltaY < -50) {
        scaleVal += 1;
        if (scaleVal >= 4) scaleVal = 4;
    }
    else if (event.deltaY > 50) {
        scaleVal -= 1;
        if (scaleVal <= 1) scaleVal = 1;
    }
    return scaleVal;
}


function setTilesetBg(id) {

    const canvW= document.querySelector("#tilesetCanvas").width;
    const canvH= document.querySelector("#tilesetCanvas").height;
    tilesetCtx.fillStyle = document.querySelector("#tsColorPicker").value;// 
    tilesetCtx.clearRect(0, 0, canvW * tilesetScale, canvH * tilesetScale);
    tilesetCtx.fillRect(0, 0, canvW * tilesetScale, canvH * tilesetScale);

    //will show tileset and tilesetgrid if 
    drawTilesetImage();
    drawSelectedTile()

   
}

function selectTileset(id) {
    //get tilesetSelected id
    let pastId = parseInt(document.querySelector("#tilesetSelected").value);
    if (pastId !== 0) {
        document.querySelector("#img_" + pastId).classList.remove("active")
    }

    document.querySelector("#tilesetSelected").value = id;
    document.querySelector("#img_" + id).classList.add("active")

    scaleTileset()
    setTilesetBg(id);
    drawTilesetImage();
    drawSelectedTile()

    if (isTilesetGridVisible)
        drawGrid(tilesetCtx,
            tilesetList[id - 1].img,
            tilesetList[id - 1].gridW,
            tilesetList[id - 1].gridH, tilesetScale, tsGridColor);
}

function drawTilesetImage() {
    // console.log("drawTilesetImage")
    const id = parseInt(document.querySelector("#tilesetSelected").value);

    if (tilesetList[id - 1] !== undefined)
        tilesetCtx.drawImage(tilesetList[id - 1].img, 0, 0);
}

function drawGrid(cctx, img, gw, gh, scale, color) {
    if (!gw || !gh) return;
    cols = Math.trunc((img.width * scale) / (gw * scale));
    rows = Math.trunc((img.height * scale) / (gh * scale));

    // console.log(`-- ${img.width} - ${img.height}, ${gw}, ${gh}, ${scale}` )
    // console.log(`-- ${cols} , ${rows}` )

    cctx.beginPath();

    if (gw !== 0)
        for (c = 1; c <= cols; c++) {
            cctx.moveTo(c * (gw), 0);
            cctx.lineTo(c * (gw), img.height)
        }

    if (gh !== 0)
        for (r = 1; r <= rows; r++) {
            cctx.moveTo(0, r * (gh));
            cctx.lineTo(img.width, r * (gh));
        }

    cctx.strokeStyle = color;
    cctx.lineWidth = 1;
    cctx.stroke();
}


function setTilesetGridW(val) {
    // console.log("Set Grid W")
    const id = parseInt(document.querySelector("#tilesetSelected").value);
    if (id === 0) return;
    tilesetList[id - 1].gridW = val;

    scaleTileset();
    setTilesetBg(id);
    drawTilesetImage();
    drawSelectedTile();

    if (isTilesetGridVisible)
        drawGrid(tilesetCtx, tilesetList[id - 1].img, parseInt(document.querySelector("#tileset_gridw").value), parseInt(document.querySelector("#tileset_gridh").value), tilesetScale, tsGridColor)
}

function setTilesetGridH(val) {
    const id = parseInt(document.querySelector("#tilesetSelected").value);
    if (id === 0) return;
    tilesetList[id - 1].gridH = val;

    scaleTileset();
    setTilesetBg(id);
    drawTilesetImage();
    drawSelectedTile();

    if (isTilesetGridVisible)
        drawGrid(tilesetCtx, tilesetList[id - 1].img, parseInt(document.querySelector("#tileset_gridw").value), parseInt(document.querySelector("#tileset_gridh").value), tilesetScale, tsGridColor)
}

function layerModalToggle(id) {
    console.log("opening modal")
    modalOpen = true;

    // $("#layerModal").focus();
    // $('#basic-modal-content').modal();

    const laier = layerList[id - 1];
    document.querySelector("#modal_layerName").value = laier.name;
    document.querySelector("#modal_layer_gw").value = laier.gridW;
    document.querySelector("#modal_layer_gh").value = laier.gridH;
    document.querySelector("#layerOpacity").value = laier.opacity;
    document.querySelector("#opacityLabel").innerHTML = `Opacity: ${laier.opacity}`;
    document.querySelector("#layerIdx").value = id - 1;
}


function closeLayerModal() {
    document.querySelector("#modal_layerName").value = "";
    document.querySelector("#modal_layer_gw").value = "";
    document.querySelector("#modal_layer_gh").value = "";
    modalOpen = false;
}


function areaModalToggle(id) {
    modalOpen = true;

    document.querySelector("#modal_areaLabel").value = areaList[id - 1].label;
    document.querySelector("#modal_area_x").value = areaList[id - 1].x
    document.querySelector("#modal_area_y").value = areaList[id - 1].y
    document.querySelector("#modal_area_w").value = areaList[id - 1].w
    document.querySelector("#modal_area_h").value = areaList[id - 1].h
    document.querySelector("#modal_area_color").value = areaList[id - 1].color
}

function closeAreaModal() {

    document.querySelector("#modal_areaLabel").value = "";
    document.querySelector("#modal_area_x").value = "";
    document.querySelector("#modal_area_y").value = "";
    document.querySelector("#modal_area_w").value = "";
    document.querySelector("#modal_area_h").value = "";
    modalOpen = false;
}

function setLayerName(val) {
    const id = parseInt(document.querySelector("#layerSelected").value);
    layerList[id - 1].name = val;
    document.querySelector(`#layer_name_${id}`).innerHTML = val;
}

function setLayerGridW(val) {
    const layerId = parseInt(document.querySelector("#layerSelected").value);
    layerList[layerId - 1].gridW = parseInt(val);

    setCanvasBg(bgSet);
    drawLayers();
    if (isGridVisible)
        drawGrid(ctx, canvas, layerList[layerId - 1].gridW, layerList[layerId - 1].gridH, scaleSet, gridColor);

}

function setLayerGridH(val) {
    const layerId = parseInt(document.querySelector("#layerSelected").value);
    layerList[layerId - 1].gridH = parseInt(val);

    setCanvasBg(bgSet);
    drawLayers();
    if (isGridVisible)
        drawGrid(ctx, canvas, layerList[layerId - 1].gridW, layerList[layerId - 1].gridH, scaleSet, gridColor);

}


function tilesetModalToggle(id) {
    modalOpen = true;
    // document.querySelector('#tileset-modal-content').modal();

    const tileset = tilesetList[id - 1];
    document.querySelector("#modal_tilesetName").value = tileset.name;
    document.querySelector("#modal_tileset_gw").value = tileset.gridW;
    document.querySelector("#modal_tileset_gh").value = tileset.gridH;
}

function closeTilesetModal() {
    document.querySelector("#modal_tilesetName").value = "";
    document.querySelector("#modal_tileset_gw").value = "";
    document.querySelector("#modal_tileset_gh").value = "";
    modalOpen = false;
}

function setTilesetName(val) {
    const id = parseInt(document.querySelector("#tilesetSelected").value);
    tilesetList[id - 1].name = val;
    document.querySelector(`#tileset_name_${id}`).innerHTML = tilesetList[id - 1].name;
}

function setTilesetGridW(val) {
    const id = parseInt(document.querySelector("#tilesetSelected").value);
    tilesetList[id - 1].gridW = parseInt(val);

    // const w = tilesetList[id-1].img.width;
    // const h = tilesetList[id-1].img.height;
    // tilesetCanvas.width = w * tilesetScale;
    // tilesetCanvas.height = h * tilesetScale;
    scaleTileset();
    setTilesetBg(id);
    drawTilesetImage();

    if (isTilesetGridVisible)
        drawGrid(tilesetCtx, tilesetList[id - 1].img, tilesetList[id - 1].gridW, tilesetList[id - 1].gridH, tilesetScale, tsGridColor);

}

function setTilesetGridH(val) {
    const id = parseInt(document.querySelector("#tilesetSelected").value);
    tilesetList[id - 1].gridH = parseInt(val);

    // const w = tilesetList[id-1].img.width;
    // const h = tilesetList[id-1].img.height;
    // tilesetCanvas.width = w * tilesetScale;
    // tilesetCanvas.height = h * tilesetScale;
    scaleTileset();
    setTilesetBg(id);
    drawTilesetImage();

    if (isTilesetGridVisible)
        drawGrid(tilesetCtx, tilesetList[id - 1].img, tilesetList[id - 1].gridW, tilesetList[id - 1].gridH, tilesetScale, tsGridColor);

}

/**
 * this function will select the portion of tileset
 * that will be set later on the map at specific selected layer
 * this is not selectTileset
 */
function selectTile(e) {
    const tilesetId = parseInt(document.querySelector("#tilesetSelected").value);
    if (tilesetId === 0) return;

    const gw = tilesetList[tilesetId - 1].gridW;
    const gh = tilesetList[tilesetId - 1].gridH;

    if (gw === 0 | gh === 0) return;


    //check for initial x & y
    if (tilePressed.presed) {
        // console.log("ENTRA A TILE PRESSED")
        const cols = calculateCells(tilesetCanvas.width / tilesetScale, gw);
        // const rows = calculateCells(tilesetList[ tilesetId-1].imgH,gh);

        const initX = Math.floor((tilePressed.x / tilesetScale) / gw)//-1;
        const initY = Math.floor((tilePressed.y / tilesetScale) / gh)//-1;
        const initIdx = (initY * cols) + initX;

        const endCoords = getMouseCoordinates(e, tilesetCanvas);
        const endX = Math.trunc((endCoords.x / tilesetScale) / gw)//-1;
        const endY = Math.trunc((endCoords.y / tilesetScale) / gh)//-1;
        const endIdx = (endY * cols) + endX;

        // console.log(`iX ${initX} iY ${initY} cols: ${cols} initIdx ${initIdx}`)
        // console.log(`eX ${endX} eY ${endY} cols: ${cols} endIdx ${endIdx}`)

        // console.log(`XX ${(endX - initX)} YY ${(endY - initY)}` )
        // console.log(`XX ${((endX - initX) * gw)+gw} YY ${((endY - initY) * gh)+gh}` )
        // let newW = Math.ceil((endCoords.x - tilePressed.x) / gw); 
        // let newH = Math.ceil((endCoords.y - tilePressed.y) / gh);

        if (initIdx === endIdx) {
            console.log("ENTRA A INDX")
            //draw only one tile
            tileSelected = {
                "tilesetId": tilesetId - 1,
                "tileset": tilesetList[tilesetId - 1].name,
                "srcX": initX * gw,
                "srcY": initY * gh,
                "tileW": gw,
                "tileH": gh,
                "index": initIdx //tileset index
            }
        }
        else {

            // console.log(`tilePressed: ${JSON.stringify(tilePressed)}`)
            // console.log(`endCoords: ${JSON.stringify(endCoords)}`)

            // console.log(`ex:${endCoords.x} - tpX:${tilePressed.x} / 32 = ${(endCoords.x - tilePressed.x) / gw}`)
            // console.log(`ex:${endCoords.y} - tpX:${tilePressed.y} / 32 = ${(endCoords.y - tilePressed.y) / gh}`)

            // const endCoords = getMouseCoordinates(e, tilesetCanvas);
            // const endX = Math.trunc((endCoords.x / tilesetScale) / gw)//-1;
            // const endY = Math.trunc((endCoords.y / tilesetScale) / gh)//-1;
            // const endIdx = (endY * cols) + endX;

            // tilePressed.x = Math.trunc(tilePressed.x / gw) * gw
            // tilePressed.y = Math.trunc(tilePressed.y / gh) * gh

            // console.log( `eX:${Math.trunc(endCoords.x) } - iX:${Math.trunc(tilePressed.x)} / scale: ${tilesetScale} `)
            // console.log( `eY:${Math.trunc(endCoords.y)} - iY:${Math.trunc(tilePressed.y)} / scale: ${tilesetScale} `)

            //this works fine, does not fill up incomplete tiles
            // let newW = Math.ceil( ( (endCoords.x - tilePressed.x) / tilesetScale ) / gw);
            // let newH = Math.ceil( ( (endCoords.y - tilePressed.y) / tilesetScale ) / gh);


            /**
             *      let iniX = Math.floor( (Math.trunc(coords.x) / tilesetScale ) / gw );
                    let iniY = Math.floor( (Math.trunc(coords.y) / tilesetScale ) / gh );
            
                    console.log(` iniX: ${iniX} * gw: `)
                    console.log(` iniY: ${iniY} * gw: `)
            
                    tilePressed.x = iniX * gw;
                    tilePressed.y = iniY * gh;
             */

            let endX = Math.ceil((Math.trunc(endCoords.x) / tilesetScale) / gw);
            let endY = Math.ceil((Math.trunc(endCoords.y) / tilesetScale) / gw);

            endX *= gw;
            endY *= gh;

            // console.log(`ex:${endX} - tp.x:${ tilePressed.x} = ${ endX - tilePressed.x }`)
            // console.log(`ex:${endY} - tp.x:${ tilePressed.y} = ${ endY - tilePressed.y }`)

            let newW = endX - tilePressed.x;
            let newH = endY - tilePressed.y;

            // console.log(`ENTRA A MULTITILE ${newW} - ${newH}`)

            // newW = newW === 0 ? gw : newW * gw;
            // newH = newH === 0 ? gh : newH * gh;

            //multiple tiles selected
            // const newWidth = 
            // const newHeight =
            tileSelected = {
                "tilesetId": tilesetId - 1,
                "tileset": tilesetList[tilesetId - 1].name,
                "srcX": tilePressed.x,
                "srcY": tilePressed.y,
                "tileW": newW,// ( endX * gw ),
                "tileH": newH,//( endY * gh ),
                "index": initIdx //tileset index
            }
            // console.log(JSON.stringify(tileSelected))
        }

    }

    setTilesetBg(tilesetId);
    drawTilesetImage();
    drawSelectedTile();

    if (tilesetList[tilesetId - 1] !== undefined && isTilesetGridVisible)
        drawGrid(tilesetCtx, tilesetList[tilesetId - 1].img, tilesetList[tilesetId - 1].gridW, tilesetList[tilesetId - 1].gridH, tilesetScale, tsGridColor);
}

/** AQUI ME QUEDE
 * this will get initial x * y coordinates
 * @param e 
 */
function pressTile(e) {
    const coords = getMouseCoordinates(e, tilesetCanvas);

    if (!tilePressed.presed) {
        tilePressed.presed = true;

        const tilesetId = parseInt(document.querySelector("#tilesetSelected").value);
        if (tilesetId === 0) return;

        const gw = tilesetList[tilesetId - 1].gridW;
        const gh = tilesetList[tilesetId - 1].gridH;

        //@todo check here the tile clicked so we can fix x & y since its initial position
        //and not where click.X and click.Y were made
        // tilePressed.x = coords.x;
        // tilePressed.y = coords.y;
        let iniX = Math.floor((Math.trunc(coords.x) / tilesetScale) / gw);
        let iniY = Math.floor((Math.trunc(coords.y) / tilesetScale) / gh);

        // console.log(` iniX: ${iniX} * gw: `)
        // console.log(` iniY: ${iniY} * gw: `)

        tilePressed.x = iniX * gw;
        tilePressed.y = iniY * gh;

    }

}

/**
 * this will draw a little rectangle of the piece of tile
 * that was selected
 */
function drawSelectedTile() {
    if (tileSelected !== undefined) {
        tilesetCtx.save();
        tilesetCtx.fillStyle = tsGridColor;
        tilesetCtx.globalAlpha = 0.4;
        tilesetCtx.fillRect(tileSelected.srcX,
            tileSelected.srcY,
            tileSelected.tileW,
            tileSelected.tileH);
        tilesetCtx.restore();
    }
}

function dragTile(e) {
    if (tileSelected !== undefined) {
        const layerId = parseInt(document.querySelector("#layerSelected").value);
        const tilesetId = parseInt(document.querySelector("#tilesetSelected").value);

        const gw = layerList[layerId - 1].gridW / 2;
        const gh = layerList[layerId - 1].gridH / 2;

        const coords = getMouseCoordinates(e, canvas);

        ctx.save()
        ctx.globalAlpha = 0.6;
        ctx.drawImage(tilesetList[tilesetId - 1].img,
            tileSelected.srcX, tileSelected.srcY, tileSelected.tileW, tileSelected.tileH,
            (coords.x / scaleSet) - gw, (coords.y / scaleSet) - gh, tileSelected.tileW, tileSelected.tileH);
        ctx.restore();

    }
}

/**
 * this will be used to calculate rows and cols
 */
function calculateCells(width, cellWidth) {
    return Math.ceil(width / cellWidth);
}

function getCellData(e, tileWidth, tileHeight, cnvs, scale) {
    const cols = calculateCells(cnvs.width / scale, tileWidth);
    const coords = getMouseCoordinates(e, cnvs);

    const xx = Math.trunc((coords.x / scale) / tileWidth)//-1;
    const yy = Math.trunc((coords.y / scale) / tileHeight)//-1;
    const index = (yy * cols) + xx;

    return {
        "xx": xx,
        "yy": yy,
        "index": index
    }

}

function putTileOnMap(e) {

    if (!tileSelected) return;

    const layerId = parseInt(document.querySelector("#layerSelected").value);

    //putting tiles while layer is invisible NOT ALLOWED!
    if (!layerList[layerId - 1].visibility) return;

    const gw = layerList[layerId - 1].gridW;
    const gh = layerList[layerId - 1].gridH;

    const cd = getCellData(e, gw, gh, canvas, scaleSet);

    // console.log(`GW: ${gw}  GH:${gh}  - canvasW: ${canvas.width} - scale: ${scaleSet}`)
    // console.log(` putTileOnMap::getCellData : ${JSON.stringify(cd)}`)
    // console.log(`x: `,cd.xx * gw)
    // console.log(`y: `,cd.yy * gh)

    if (isPainting) {
        if (!layerList[layerId - 1].map[cd.index]) {
            const xx = cd.xx * gw;
            const yy = cd.yy * gh;

            layerList[layerId - 1].map[cd.index] = {
                "x": xx,
                "y": yy,
                "tilesetId": tileSelected.tilesetId,
                "tileset": tileSelected.tileset,
                "srcX": tileSelected.srcX, //tileset srcX
                "srcY": tileSelected.srcY, //tileset srcY
                "tileW": tileSelected.tileW,
                "tileH": tileSelected.tileH,
                "index": tileSelected.index, //tileset index
                "dstX": xx, //x position of tile in layer( used to draw in layer canvas)
                "dstY": yy //y position of tile in layer( used to draw in layer canvas)
            };

            //to get invert Y position value for babylon
            let ypos = (canvas.height / scaleSet) / tilesetList[tileSelected.tilesetId].gridH;

            console.log(` CH: ${(canvas.height/scaleSet)} / TH: ${tilesetList[tileSelected.tilesetId].gridH} = ${ypos}`)
            // console.log("== LAYERLIST ==")
            // console.log(` ${layerList[layerId - 1].id} -  ${layerList[layerId - 1].name}`)
            // console.log("== LAYERLIST ==")
            console.log(layerList[layerId - 1])
            layerList[layerId - 1].frames.push(   
                {
                    "tileIndex": tileSelected.index,
                    "filename": tileSelected.tileset,
                    "frame": {
                        x: tileSelected.srcX,
                        y: tileSelected.srcY,
                        w: tileSelected.tileW,
                        h: tileSelected.tileH
                    },
                    "position": { x: cd.xx, y: --ypos - cd.yy },
                    "rotated": false,
                    "trimmed": false,
                    "spriteSourceSize": { "x": 0, "y": 0, "w": tileSelected.tileW, "h": tileSelected.tileH },
                    "sourceSize": { "w": tileSelected.tileH, "h": tileSelected.tileH }
                }
            );


            // console.log("tileMap entry:",layerList[layerId - 1].map[cd.index])
            // console.log("tileMap babylonFrame:",layerList[layerId - 1].frames[""+cd.index])
        }
        else if (layerList[layerId - 1].map[cd.index].index !== tileSelected.index) {
            // layerList[layerId-1].map[ cd.index ].tile = tileSelected;
            layerList[layerId - 1].map[cd.index].index = tileSelected.index;
            layerList[layerId - 1].map[cd.index].srcX = tileSelected.srcX;
            layerList[layerId - 1].map[cd.index].srcY = tileSelected.srcY;

            //updating frames.frame
            for (let idx = 0; idx < layerList[layerId - 1].frames.length; idx++) {
                const frame = layerList[layerId - 1].frames[idx];
                if (frame.tileIndex === tileSelected.index) {
                    layerList[layerId - 1].frames[idx].frame.tileIndex = tileSelected.index;
                    layerList[layerId - 1].frames[idx].frame.x = tileSelected.srcX;
                    layerList[layerId - 1].frames[idx].frame.y = tileSelected.srcY;
                    break;
                }
            }
        }
    }
    else if (layerList[layerId - 1].map[cd.index] !== undefined) {

        layerList[layerId - 1].map[cd.index] = undefined;

        //removing frames.frame
        for (let idx = 0; idx < layerList[layerId - 1].frames.length; idx++) {
            const frame = layerList[layerId - 1].frames[idx];
            if (frame !== undefined && frame.tileIndex === tileSelected.index) {
                layerList[layerId - 1].frames[idx] = undefined;
                break;
            }
        }
    }

    //redraw canvas with tile on it 
    //set canvas bg
    //draw layers of tiles on canvas
    setCanvasBg(bgSet);
    drawLayers();

    if (isGridVisible)
        drawGrid(ctx, canvas, layerList[layerId - 1].gridW, layerList[layerId - 1].gridH, scaleSet, gridColor);

}


function initMapArray(cnvs, gridW, gridH) {
    const cols = calculateCells(cnvs.width, gridW)
    const rows = calculateCells(cnvs.height, gridH)

    let arr = new Array(cols * rows);
    return arr;

}

/**
 * draws every layer and after that draws the areas if visible
 */
function drawLayers() {

    for (let i = 0; i < layerList.length; i++) {
        if (layerList[i].visibility) {
            for (let tileIdx = 0; tileIdx < layerList[i].map.length; tileIdx++) {
                const tile = layerList[i].map[tileIdx];
                if (!tile) continue;
                else {
                    // const tile = cell.tile;
                    // console.log(`-- DRAWLAYER ${tileIdx} : ${JSON.stringify(tile) }`)
                    ctx.save();
                    ctx.globalAlpha = layerList[i].opacity;
                    ctx.drawImage(tilesetList[tile.tilesetId].img, tile.srcX, tile.srcY, tile.tileW, tile.tileH, tile.dstX, tile.dstY, tile.tileW, tile.tileH);
                    ctx.restore();
                }
            }
        }

    }
    //draw here areas
    for (let i = 0; i < areaList.length; i++) {
        const area = areaList[i];
        if (area.visibility) {
            ctx.strokeStyle = areaList[i].color;
            ctx.strokeRect(area.x, area.y, area.w, area.h);
        }
    }

}


function changeGridVisibility() {
    isGridVisible = !isGridVisible;

    const gridBtn = document.querySelector(`#showGrid`);

    if (isGridVisible)
        gridBtn.className = 'btn bg-primary';
    else
        gridBtn.className = 'btn g-secondary';

    const layerId = parseInt(document.querySelector("#layerSelected").value);
    // const tilesetId = parseInt($("#tilesetSelected").val());

    if (isGridVisible) {
        drawLayers();
        drawGrid(ctx, canvas, layerList[layerId - 1].gridW, layerList[layerId - 1].gridH, scaleSet, gridColor);
    }
    else {
        setCanvasBg(bgSet)
        drawLayers();
    }

}

function changeTilesetGridVisibility() {
    isTilesetGridVisible = !isTilesetGridVisible;

    const btnTsGrid = document.querySelector("#showTilesetGrid");

    if (isTilesetGridVisible)
        btnTsGrid.className = 'btn bg-primary';
    else
        btnTsGrid.className = 'btn bg-secondary';

    const tilesetId = parseInt(document.querySelector("#tilesetSelected").value);

    if (isTilesetGridVisible) {

        if (tilesetId !== 0)
            setTilesetBg(tilesetId);

        drawTilesetImage();
        drawSelectedTile();

        if (tilesetList[tilesetId - 1] !== undefined && isTilesetGridVisible)
            drawGrid(tilesetCtx, tilesetList[tilesetId - 1].img, tilesetList[tilesetId - 1].gridW, tilesetList[tilesetId - 1].gridH, tilesetScale, tsGridColor);

    }
    else {
        drawTilesetImage();
        drawSelectedTile();
    }
}

//XXX
function changeBg(val) {
    setCanvasBg(val);
    drawLayers();

    if (isGridVisible) {
        const layerId = parseInt(document.querySelector("#layerSelected").value);
        drawGrid(ctx, canvas, layerList[layerId - 1].gridW, layerList[layerId - 1].gridH, scaleSet, gridColor);
    }

}

function removeLayer() {
    const layerId = parseInt(document.querySelector("#layerSelected").value);
    if (layerList.length == 1) {
        alert(`layer "${layerList[layerId - 1].name}" cannot be removed cause there must be at least 1 layer.`)
    }
    else {
        layerIdCounter = 0;
        //removing layer from array
        layerList.splice(layerId - 1, 1);

        let txt = "";
        for (lyr of layerList) {
            const lyrId = ++layerIdCounter;
            lyr.id = lyrId;
            txt += getLayerItemTemplate(lyrId, lyr.name);
        }

        document.querySelector("#layerList").innerHTML = txt;

    }
    modalOpen = false;

    setCanvasBg(bgSet);
    drawLayers();
    if (isGridVisible)
        drawGrid(ctx, canvas, layerList[layerId - 1].gridW, layerList[layerId - 1].gridH, scaleSet, gridColor);

}

function addLayer() {
    const lyrId = ++layerIdCounter;
    const name = `layer${lyrId}`

    layerList.push({
        "id": lyrId,
        "name": name,
        "map": initMapArray(canvas, LYR_DEF_GRIDW, LYR_DEF_GRIDH),
        "gridW": LYR_DEF_GRIDW,
        "gridH": LYR_DEF_GRIDH,
        "cols": LYR_DEF_COLS,
        "rows": LYR_DEF_ROWS,
        "visibility": true,
        "opacity": 1,
        "frames": []
    })

    const txt = getLayerItemTemplate(lyrId, name);
    document.querySelector("#layerList").insertAdjacentHTML('beforeend', txt);
}


function getLayerItemTemplate(id, name) {
    let txt = "";
    txt += `<li class="list-group-item" id="layer_itm_list_${id}" onclick="selectLayer(${id})" >`;
    txt += `<input class="form-check-input" type="checkbox" id="cb_layer_${id}" checked onchange="changeLayerVisibility(${id})" />`;
    txt += `<span id="layer_name_${id}">${name}</span>`;
    txt += `<button type="button" id="layerSettings_${id}" class="btn bg-danger" style="float:right;" data-bs-toggle="modal" data-bs-target="#layerModal" onclick="layerModalToggle(${id})   " >`;
    txt += `<i class="bi-gear"> </i></button>`;
    txt += `</li>`;
    return txt;
}

function getAreaItemTemplate(id, name) {
    let txt = "";
    txt += `<li class="list-group-item" id="area_itm_list_${id}" onclick="selectArea(${id})" >`;
    txt += `<input class="form-check-input" type="checkbox" id="cb_area_${id}" checked onchange="changeAreaVisibility(${id})" />`;
    txt += `<span id="area_name_${id}">${name}</span>`;
    txt += `<button type="button" id="areaSettings_${id}" class="btn bg-danger" style="float:right;" data-bs-toggle="modal" data-bs-target="#areaModal" onclick="areaModalToggle(${id})" >`;
    txt += `<i class="bi-gear"> </i></button>`;
    txt += `</li>`;
    return txt;
}

function selectLayer(id) {
    //get tilesetSelected id
    let pastId = parseInt(document.querySelector("#layerSelected").value);
    if (pastId !== 0)
        document.querySelector("#layer_itm_list_" + pastId).classList.remove("active");

    document.querySelector("#layerSelected").value = id;
    document.querySelector("#layer_itm_list_" + id).classList.add("active");
}


function setPainting(paint) {
    isPainting = paint;

    const paintBtn = document.getElementById("paintBtn");
    const eraserBtn = document.getElementById("eraserBtn");

    if (isPainting) {
        paintBtn.className = "btn bg-warning";
        eraserBtn.className = "btn bg-secondary";
    } else {
        paintBtn.className = "btn bg-secondary";
        eraserBtn.className = "btn bg-warning";
    }
}

function changeLayerVisibility(id) {
    layerList[id - 1].visibility = !layerList[id - 1].visibility;

    setCanvasBg(bgSet);
    drawLayers();
    if (isGridVisible) {
        const layerId = parseInt(document.querySelector("#layerSelected").value);
        drawGrid(ctx, canvas, layerList[layerId - 1].gridW, layerList[layerId - 1].gridH, scaleSet, gridColor);
    }

}


function resetLayer() {
    const layerId = parseInt(document.querySelector("#layerSelected").value)
    const lyr = layerList[layerId - 1];
    lyr.map = initMapArray(canvas, lyr.gridW, lyr.gridH);
    lyr.frames = {}

    setCanvasBg(bgSet)
    drawLayers();

    if (isGridVisible)
        drawGrid(ctx, canvas, lyr.gridW, lyr.gridH, scaleSet, gridColor);
}


function setLayerOpacity(val) {
    const layerId = parseInt(document.querySelector("#layerSelected").value);

    layerList[layerId - 1].opacity = parseFloat(val);
    // $("#layerOpacity").val()
    document.querySelector("#opacityLabel").innerHTML = `Opacity: ${val}`;
}


function addArea() {
    const arId = ++areaIdCounter;
    const name = `area${arId}`

    areaList.push({
        "id": arId,
        "name": name,
        "label": "",
        "x": 0,
        "y": 0,
        "w": 32,
        "h": 32,
        "color": "#FFDA24",
        "visibility": true
    })

    const txt = getAreaItemTemplate(arId, name);
    document.querySelector("#areaList").insertAdjacentHTML('beforeend', txt);
}

function selectArea(id) {

    console.log("::: ID ", id, areaIdSelected)
    const element = document.querySelector("#area_itm_list_" + areaIdSelected);

    if (element && element.classList.contains("active")) {
        element.classList.remove("active");
    }

    areaIdSelected = id;
    document.querySelector("#area_itm_list_" + id).classList.add("active");
}

function updateAreaData() {
    areaList[areaIdSelected - 1].label = document.querySelector("#modal_areaLabel").value;
    areaList[areaIdSelected - 1].x = parseInt(document.querySelector("#modal_area_x").value)
    areaList[areaIdSelected - 1].y = parseInt(document.querySelector("#modal_area_y").value)
    areaList[areaIdSelected - 1].w = parseInt(document.querySelector("#modal_area_w").value)
    areaList[areaIdSelected - 1].h = parseInt(document.querySelector("#modal_area_h").value)
    areaList[areaIdSelected - 1].color = document.querySelector("#modal_area_color").value

    setCanvasBg(bgSet)
    drawLayers();

    if (isGridVisible) {
        const lyr = parseInt(document.querySelector("#layerSelected").value);
        drawGrid(ctx, canvas, lyr.gridW, lyr.gridH, scaleSet, gridColor);
    }
}

function changeAreaVisibility(id) {
    const isCheked = document.getElementById("cb_area_" + id).checked;
    areaList[id - 1].visibility = isCheked;

    setCanvasBg(bgSet);
    drawLayers();

    if (isGridVisible) {
        const lyr = parseInt(document.getElementById("layerSelected").value);
        drawGrid(ctx, canvas, layerList[lyr - 1].gridW, layerList[lyr - 1].gridH, scaleSet, gridColor);
    }
}


function removeArea() {
    areaIdCounter = 0;
    areaList.splice(parseInt(areaIdSelected) - 1, 1);

    let areaTxt = "";

    for (area of areaList) {
        area.id = ++areaIdCounter;
        areaTxt += getAreaItemTemplate(area.id, "area" + area.id);
    }
    document.querySelector("#areaList").innerHTML = areaTxt;
    areaIdSelected = -1;


    setCanvasBg(bgSet)
    drawLayers();

    if (isGridVisible) {
        const lyr = parseInt(document.querySelector("#layerSelected").value);
        drawGrid(ctx, canvas, lyr.gridW, lyr.gridH, scaleSet, gridColor);
    }

    modalOpen = false;
}


function removeTileset() {
    imgIdCounter = 0;
    const tilesetId = parseInt(document.querySelector("#tilesetSelected").value);
    tilesetList.splice(parseInt(tilesetId) - 1, 1);

    let tlsetTxt = "";

    for (tlset of tilesetList) {
        tlset.id = ++imgIdCounter;
        tlsetTxt += getTilesetTemplate(tlset.id, tlset.name);

        // area.id = ++areaIdCounter;
        // areaTxt += getAreaItemTemplate( area.id, "area"+area.id );
    }
    document.querySelector("#tilesetList").innerHTML = tlsetTxt;
    document.querySelector("#tilesetSelected").value = 0;

    tilesetCanvas.width = 128;
    tilesetCanvas.height = 128;
    tilesetCtx.fillStyle = "#ccc";
    tilesetCtx.fillRect(0, 0, 128, 128);
    modalOpen = false;

}


function getTilesetTemplate(id, name) {
    let txt = `<li class="list-group-item" onclick="selectTileset(${id})" id="img_${id}">`;
    txt += `<span id="tileset_name_${id}" >${name}</span><button type="button" id="" class="btn bg-danger" style="float:right;" data-bs-toggle="modal" data-bs-target="#tilesetModal" onclick="tilesetModalToggle(${id})" >`;
    txt += `<i class="bi-gear"> </i></button></li>`;
    return txt;
}


/**
* this function will move layer up or down 
* but only if the index of the item to move is not 
* te first or the last
*/
function moveLayer(dir) {
    let idx = parseInt(document.querySelector("#layerIdx").value);

    itemToMove = layerList.splice(idx, 1)[0];
    if (dir === "up" && idx > 0) {
        idx = idx - 1
        // if(idx >= layerList.length )idx=layerList.length;
    }
    else if (dir === "down" && idx < layerList.length) {
        idx = idx + 1;
        // if(idx <= 0 )idx=0;
    }

    // console.log(`adding idx: ${idx}`, itemToMove.name );
    layerList.splice(idx, 0, itemToMove);
    console.log(layerList)

    document.querySelector("#layerIdx").value = idx;

    //list have been updated, redraw layer list
    // console.log("after moving:")
    let layerListTemplate = "";
    for (const i in layerList) {
        const lyr = layerList[i];
        // console.log(": ", lyr.name)
        layerListTemplate += getLayerItemTemplate(parseInt(i) + 1, lyr.name);
    }

    document.querySelector("#layerList").innerHTML = layerListTemplate;


    setCanvasBg(bgSet)
    drawLayers();

    if (isGridVisible) {
        const lyr = parseInt(document.querySelector("#layerSelected").value);
        drawGrid(ctx, canvas, lyr.gridW, lyr.gridH, scaleSet, gridColor);
    }

}

/**
 * this function will load the content of a tilered file and will create the json with that
 */
function loadTileredJsonFile() {}

/**
 * function to trigger load a project from a previously downloaded one
 */
function loadProject() {

    const res = confirm("if you load a project content will be reset, are you sure?")
    if (res) {
        isLoadingProject = true;
        // const fileInput = document.getElementById("upload-files");
        // fileInput.click();
        triggerUploadImgs();
    }

}

/**
 * to obtain mime type/extension from uploaded files
 * @param {*} fileName 
 * @returns 
 */
function getFileType(fileName) {
    var fileExtension = fileName.split('.').pop().toLowerCase();
    if (fileExtension === 'json') {
        return 'json';
    } else if (fileExtension === 'png') {
        return 'png';
    } else {
        return undefined;
    }
}