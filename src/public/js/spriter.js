const minCanvasWidth = 512;
const minCanvasHeight = 512;
const bgPatternsImg = ["/img/pattern/gray.png", "/img/pattern/white.png", "/img/pattern/black.png"];

const imageName = "texture_atlas.png";
const jsonName = "texture_atlas.json";

let imgIdCounter = 0;
const imageList = [];

const imageListElement = undefined;

const canvas = document.getElementById('canvas');
let ctx = undefined;
let patternImg = undefined;
let color = undefined;

let bgSet = undefined;
let highlightIdSet = -1;
let scaleSet = 1;

let selectImgX = 0;
let selectImgY = 0;
let imgIdSelected = -1;

document.addEventListener('DOMContentLoaded', function () {
    ctx = canvas.getContext('2d');

    // loadImg(bgPatternsImg[0]).then(img => {
    //     patternImg = img;
    //     setCanvasBg("pattern");
    // });

    setCanvasBg();
    setHighlightColor();

    document.getElementById('upload-img').addEventListener('change', (event) => {
        const fileList = event.target.files;
        console.log("setting bg loading imgs: ", fileList.length);

        loadImages(fileList);
    });

    window.onbeforeunload = function () {
        return 'Are you sure you want to leave?';
    };

    canvas.addEventListener("mousewheel", (e) => {
        e.preventDefault();
        console.log(`MOUSE WHEEL:`, e);

        if (e.deltaY < -50) {
            scaleSet += 1;
            if (scaleSet >= 4) scaleSet = 4;
        } else if (e.deltaY > 50) {
            scaleSet -= 1;
            if (scaleSet <= 1) scaleSet = 1;
        }


        scaleCanvas(scaleSet);
        document.getElementById("scaleSel").value = scaleSet;
    });

    canvas.addEventListener("mouseup", (e) => 
    {
        const coords = getMouseCoordinates(e);

        for (const img of imageList) {
            if (pointCollision(coords.x, coords.y, img.imageMeasures.x, img.imageMeasures.y, img.imageMeasures.w, img.imageMeasures.h)) {
                getData(img.id);
                break;
            }
        }

        releaseImg(e);
    });

    canvas.addEventListener("mousedown", (e) => {
        selectImg(e);
    });

    canvas.addEventListener("mousemove", (e) => {
        dragImg(e);
    });
});//Doc loaded


function setCanvasBg(value) 
{
    const bgColorPicker = document.querySelector("#bgColorPicker");

    ctx.fillStyle = bgColorPicker.value;

    // bgSet = value;


    // switch (value) {
    //     case "pattern":
    //         ctx.fillStyle = ctx.createPattern(patternImg, "repeat");
    //         break;
    //     case "gray":
    //         ctx.fillStyle = "#cccccc";
    //         break;
    //     case "white":
    //         ctx.fillStyle = "#FFFFFF";
    //         break;
    //     case "black":
    //         ctx.fillStyle = "#000000";
    //         break;
    // }

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawImgs();

    showHighlight(parseInt(document.getElementById("img_sel_id").value));
}

function setCanvasWidth(newWidth) {
    canvas.width = newWidth;
    setCanvasBg(bgSet);
    drawImgs();
}

function setCanvasHeight(newHeight) {
    canvas.height = newHeight;
    setCanvasBg(bgSet);
    drawImgs();
}

function triggerUploadImgs() {
    document.getElementById("upload-img").click();
}

function loadImages(fileList) {
    for (const file of fileList) {
        if (checkRepeatedImg(file)) continue;
        const fileReader = new FileReader();

        fileReader.onload = function (e) {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const imgObj = {
                    id: ++imgIdCounter,
                    name: file.name.substring(0, file.name.lastIndexOf('.')),
                    label: "",
                    copies: 1,
                    imageMeasures: {
                        x: 0,
                        y: getY(img),
                        w: img.width,
                        h: img.height,
                        frames: 1,
                        frameWidth: img.width,
                        frameHeight: img.height,
                    },
                    img: img,
                };

                imageList.push(imgObj);

                setCanvasBg(bgSet);
                drawImgs();

                let itmList = "";
                for (const imgData of imageList) {
                    itmList += getItemTemplate(imgData);
                }

                document.getElementById("imageList").innerHTML = itmList;

                if (scaleSet !== 1) scaleCanvas(scaleSet);
            };
        };

        fileReader.readAsDataURL(file);
    }
}

function drawImgs() {
    for (const imgData of imageList) {
        ctx.drawImage(imgData.img, imgData.imageMeasures.x, imgData.imageMeasures.y);
    }
}

function getItemTemplate(data) {
    let txt = `<li id="list_item_${data.id}" onclick="getData(${data.id})" class="list-group-item" ><span id="list_item_name_${data.id}" >${data.name}</span>`;
    txt += `<button type="button" id="" class="btn btn-danger" style="float:right;" onclick="removeItem(${data.id})" >   `;
    txt += `<i class="bi-trash-fill"> </i></button></li>`;

    return txt;
}

function getY(img) {
    let maxY = 0;
    for (let idx = 0; idx < imageList.length; idx++) {
        let yx = imageList[idx].imageMeasures.y + imageList[idx].imageMeasures.h;
        if (yx >= maxY) maxY = yx;
    }

    return maxY;
}

function toggle(id) {
    highlightIdSet = id;

    setCanvasBg(bgSet);
    showHighlight(id);
}

function showHighlight() {
    const id = parseInt(document.getElementById("img_sel_id").value);

    if (imageList[id - 1]) {
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        const img = imageList[id - 1];

        if (img.imageMeasures.w / img.imageMeasures.frameWidth !== 1) {
            for (let i = 0; i < img.imageMeasures.frames; i++) {
                const xx = i * img.imageMeasures.frameWidth;
                ctx.strokeRect(img.imageMeasures.x + xx, img.imageMeasures.y, img.imageMeasures.frameWidth, img.imageMeasures.h);
            }
        } else {
            ctx.strokeRect(img.imageMeasures.x, img.imageMeasures.y, img.imageMeasures.w, img.imageMeasures.h);
        }
    }
}

async function loadImg(url) {
    return await new Promise((resolve) => {
        const img = new Image();
        img.addEventListener('load', () => {
            resolve(img);
        });
        img.src = url;
    });
}

function setHighlightColor() {
    gridColor = document.getElementById("highlightColor").value;
    showHighlight(parseInt(document.getElementById("img_sel_id").value));
}

function removeItem(id) {
    maxH = 0;
    counter = 0;
    imageList.splice(Number.parseInt(id) - 1, 1);

    for (const img of imageList) {
        img.id = ++counter;
    }

    setCanvasBg(bgSet);
    drawImgs();

    let itmList = "";
    for (const imgData of imageList) {
        itmList += getItemTemplate(imgData);
    }

    document.getElementById("imageList").innerHTML = itmList;
}

function setFrameWidth(val) {
    const id = parseInt(document.getElementById("img_sel_id").value);

    const newFrameWidth = parseInt(val);
    const frames = Math.trunc(imageList[id - 1].imageMeasures.w / newFrameWidth);
    if (frames > 0) {
        imageList[id - 1].imageMeasures.frameWidth = newFrameWidth;
        imageList[id - 1].imageMeasures.frames = frames;
        document.getElementById("img_sel_f").value = frames;
    } else {
        alert("number of frames must be at least 1");
        document.getElementById("img_sel_fw").value = imageList[id - 1].imageMeasures.frameWidth;
    }

    setCanvasBg(bgSet);
    drawImgs();
    showHighlight(id);
}

function setImgX(val) {
    const id = parseInt(document.getElementById("img_sel_id").value);
    imageList[id - 1].imageMeasures.x = parseInt(val);
    setCanvasBg(bgSet);
    drawImgs();
    showHighlight(id);
}

function setImgY(val) {
    const id = parseInt(document.getElementById("img_sel_id").value);
    imageList[id - 1].imageMeasures.y = parseInt(val);
    setCanvasBg(bgSet);
    drawImgs();
    showHighlight(id);
}

function alignBottom() 
{
    let xx = 0,
        xbigger = 0;
    let yy = 0,
        ybigger = 0;

    let maxW = canvas.width;
    let maxH = canvas.height;

    for (const img of imageList) {
        xx = parseInt(img.imageMeasures.x) + parseInt(img.imageMeasures.w);
        if (xx > xbigger) xbigger = xx;

        yy = parseInt(img.imageMeasures.y) + parseInt(img.imageMeasures.h);
        if (yy > ybigger) ybigger = yy;
    }

    if (imageList.length !== 0) {
        document.getElementById("cvWidth").value = xbigger;
        canvas.width = xbigger;
        document.getElementById("cvHeight").value = ybigger;
        canvas.height = ybigger;
    }

    scaleCanvas(scaleSet);
    setCanvasBg(bgSet);
    drawImgs();
}

function download() {
    downloadZip();
}

function downloadCanvasAsImage() {
    scaleCanvas(1);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawImgs();

    let imgUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    saveAs(imgUrl, "atlas.png");

    scaleCanvas(scaleSet);
    setCanvasBg(bgSet);
}

function downloadJsonData() {
    let jsonFile = new Blob([JSON.stringify(imageList)], { type: 'application/javascript;charset=utf-8' });
    saveAs(jsonFile, "atlas.json");
}

function downloadZip() 
{
    scaleCanvas(1);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawImgs();

    const zip = new JSZip();
    zip.file("atlas.json", JSON.stringify(imageList));
    zip.file("atlas.png", canvas.toDataURL("image/png").split(";base64,")[1], { base64: true });

    entryArr = {};

    for (const entry of imageList) {
        let measures = JSON.parse(JSON.stringify(entry.imageMeasures));
        measures.w = measures.frameWidth;
        entryArr[entry.name] = { frame: entry.imageMeasures };
    }

    zip.file("babylonAtlas.json", JSON.stringify({ frames: entryArr }));


    //SAVE ALL FRAMES IN A FORMAT CAN BE USED BY babylon SpritePackedManager
    //at thend if animations exists initial and end frame will be set with the name of the sprite
    spritePacked = {};
    animationFranes = {};

    let frameidx = 0;
    for (const entry of imageList) 
    {
        let measures = JSON.parse(JSON.stringify(entry.imageMeasures));
        // measures.w = measures.frameWidth;
        // entryArr[entry.name] = { frame: entry.imageMeasures };
        
        //if there are several frames of an sprite, make it individual
        const name = entry.name;
        const frames = measures.frames;

        if( frames > 1 )
        {

            
            let initFrame = 0;
            let endFrame = 0;

            for( let idx = 0; idx < frames; idx++ ) 
            {
                
                if( idx === 0 ) initFrame = frameidx;
               

                const x = measures.x + ( idx * measures.frameWidth )
                const y = measures.y;
                const w = measures.frameWidth;
                const h = measures.frameHeight;

                const frame = {
                    "x": x,
                    "y": y,
                    "w": w,
                    "h": h,
                }

                spritePacked[ name+`_f${idx}` ] = { "frame": frame }

                

                if( idx === frames-1 ){
                    endFrame = frameidx;
                    animationFranes[ name ] = { "initFrame":initFrame, "endFrame":endFrame  };
                }
                frameidx++;
            }


        }
        else
        {
            const x = measures.x;
            const y = measures.y;
            const w = measures.frameWidth;
            const h = measures.frameHeight;

            const frame = {
                "x": x,
                "y": y,
                "w": w,
                "h": h,
            }

            spritePacked[ name ] = { "frame": frame }
            frameidx++;
        }

        // const obj = { "frame":{} }

        // spritePacked[ entry.name ] = {}
    }//

    zip.file("spritePakedAtlas.json", JSON.stringify({ "frames": spritePacked, "animationFranes": animationFranes  }));


    zip.generateAsync({ type: "blob" }).then(content => {
        saveAs(content, "spriter.zip");
    });

    scaleCanvas(scaleSet);
    setCanvasBg(bgSet);
}//

function scaleCanvas(val) {
    console.log(`scale cavnas: ${val}`)
    scaleSet = val;

    canvas.width = parseInt(document.getElementById("cvWidth").value * val);
    canvas.height = parseInt(document.getElementById("cvHeight").value * val);

    ctx.scale(scaleSet, scaleSet);

    setCanvasBg(bgSet);
}

function checkRepeatedImg(file) {
    for (const img of imageList) {
        if (file.name === img.name) {
            return true;
        }
    }
    return false;
}

function setName(val) {
    const id = parseInt(document.getElementById("img_sel_id").value);
    imageList[id - 1].name = val;

    document.getElementById("list_item_name_" + id).innerHTML = val;
}

function setCopies(val) {
    const id = parseInt(document.getElementById("img_sel_id").value);
    imageList[id - 1].copies = parseInt(val);
}

function getMouseCoordinates(e) {
    const boundingRect = canvas.getBoundingClientRect();
    let eX = e.clientX - boundingRect.left;
    let eY = e.clientY - boundingRect.top;

    return { x: eX, y: eY };
}

function pointCollision(x, y, x2, y2, w2, h2) {
    return x >= x2 && x <= x2 + w2 && y >= y2 && y <= y2 + h2;
}

function selectImg(e) {
    if (imgIdSelected === -1) 
    {
        const coords = getMouseCoordinates(e);


        // console.log(`scale: ${scaleSet} , ${ JSON.stringify(coords) }`)
        // console.log(scaleSet)
        const xx = coords.x / parseInt(scaleSet) 
        const yy = coords.y / parseInt(scaleSet)

        console.log(` xx: ${xx} - yy: ${yy}`)

        for (const img of imageList) {
            if (pointCollision(xx, yy, img.imageMeasures.x, img.imageMeasures.y, img.imageMeasures.w, img.imageMeasures.h)) {
                selectImgX = xx - img.imageMeasures.x;
                selectImgY = yy - img.imageMeasures.y;
                imgIdSelected = img.id;
                break;
            }
        }
    }
}

function dragImg(e) 
{
    if (imgIdSelected !== -1) 
    {
        const coords = getMouseCoordinates(e);
    
        const xx = coords.x / parseInt(scaleSet) 
        const yy = coords.y / parseInt(scaleSet)

        let nX = xx - selectImgX;
        let nY = yy - selectImgY;


        imageList[imgIdSelected - 1].imageMeasures.x = nX;
        imageList[imgIdSelected - 1].imageMeasures.y = nY;

      
        setCanvasBg(bgSet);
        drawImgs();
        showHighlight(imgIdSelected);
    }
}

function releaseImg(e) 
{
    if (imgIdSelected !== -1) 
    {
        const coords = getMouseCoordinates(e);

        const xx = coords.x / parseInt(scaleSet) 
        const yy = coords.y / parseInt(scaleSet)

        let newX = Math.trunc(xx - selectImgX);
        let newY = Math.trunc(yy - selectImgY);

        newX = newX < 0 ? 0 : newX;
        newY = newY < 0 ? 0 : newY;

        imageList[imgIdSelected - 1].imageMeasures.x = newX;
        imageList[imgIdSelected - 1].imageMeasures.y = newY;


        console.log(` imgSelected: ${imgIdSelected}`)
        console.log( document.getElementById(`item_${imgIdSelected}_x`) )
        // document.getElementById(`item_${imgIdSelected}_x`).value = nX;
        // document.getElementById(`item_${imgIdSelected}_y`).value = nY;

        getData(imgIdSelected);
        imgIdSelected = -1;
    }
}

function getData(id) {
    for (const img of imageList) {
        if (img.id === id) {
            for (const i of imageList) {
                document.getElementById(`list_item_${i.id}`).classList.remove("active");
            }

            document.getElementById(`list_item_${img.id}`).classList.add("active");

            document.getElementById("img_sel_id").value = id;
            document.getElementById("img_sel_name").value = img.name;
            document.getElementById("img_sel_label").value = img.label;
            document.getElementById("img_sel_copies").value = img.copies;
            document.getElementById("img_sel_x").value = img.imageMeasures.x;
            document.getElementById("img_sel_y").value = img.imageMeasures.y;
            document.getElementById("img_sel_w").value = img.imageMeasures.w;
            document.getElementById("img_sel_h").value = img.imageMeasures.h;
            document.getElementById("img_sel_fw").value = img.imageMeasures.frameWidth;
            document.getElementById("img_sel_fh").value = img.imageMeasures.frameHeight;
            document.getElementById("img_sel_f").value = img.imageMeasures.frames;

            setCanvasBg(bgSet);
            imgIdSelected = id;
            showHighlight(imgIdSelected);
            imgIdSelected = -1;
            break;
        }
    }
}

function setLabel(val) {
    const id = parseInt(document.getElementById("img_sel_id").value);
    imageList[id - 1].label = val;
}
