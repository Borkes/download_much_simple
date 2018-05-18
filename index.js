

module.exports = function (pictures) {
    let label = '';
    for (let picture of pictures) {
        label += `
        <lable>
            <img src="${picture}" width="200" height="200">
            <input name="picture" type="checkbox" value="${picture.substr(picture.lastIndexOf('/') + 1)}" />
        </lable>
        `
    }
    return `
    <!DOCTYPE html>
    <html lang="zh-cn" class="no-js logged-in client-root">

    <head>
        <meta charset="utf-8">
        <title>
            picture
        </title>
    </head>

    <body>
        <div id="section">
            <form action="/download-linux" method="get">
            
                <div>
                ` + label +
        // <label>
        //     <img src="/dist/cat.jpg" alt="" width="200" height="200">
        //     <input name="picture" type="checkbox" value="cat.jpg" />
        // </label>
        // <label>
        //     <img src="/dist/egg-wolf.jpg" alt="" width="200" height="200">
        //     <input name="picture" type="checkbox" value="egg-wolf.jpg" />
        // </label>
        `
                </div>
                <div id="button-download">
                    <input name="" type="submit" value="下载" />
                </div>
            </form>
        </div>
    </body>

    <style>
        #section {
            padding-left: 0px;
        }

        #button-download {
            float: left;
            padding-left: 0px;
        }
    </style>

    </html>
    `
}