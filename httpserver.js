const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { Readable } = require('stream');
const querystring = require('querystring');
const { exec, spawn } = require('child_process');
const index = require('./index');

//创建服务器监听端口
const server = http.createServer(handleRequest);
server.listen(8088);

console.log('server start at 8088 port')

function handleRequest(req, res) {
    let pathName = url.parse(req.url).pathname;
    /**根据pathName，路由调用不同处理逻辑 */
    if (pathName === '/') {
        resIndex(req, res); //响应HTML页面到Web客户端
    } else if (pathName.match('/dist/')) {
        resImage(req, res);
    } else if (pathName.match('/download-linux')) {
        download(req, res);
    } else {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end('not found');
    }
}

//首页
function resIndex(req, res) {
    function compressHandle(raw, statusCode, reasonPhrase) {
        var stream = raw;
        var acceptEncoding = req.headers['accept-encoding'] || "";
        var matched = ext.match(config.Compress.match);
        if (matched && acceptEncoding.match(/\bgzip\b/)) {
            res.setHeader("Content-Encoding", "gzip");
            stream = raw.pipe(zlib.createGzip());
        } else if (matched && acceptEncoding.match(/\bdeflate\b/)) {
            res.setHeader("Content-Encoding", "deflate");
            stream = raw.pipe(zlib.createDeflate());
        }
        res.writeHead(statusCode, reasonPhrase);
        stream.pipe(res);
    };
    fs.readdir('./dist', function (err, files) {
        if (err) {
            return res.end('error');
        }
        let pictures = files.map(file => {
            return '/dist/' + file;
        })

        //如果有断点续载,根据需要优化，暂时关闭
        if (0 && req.headers["range"]) {
            var range = parseRange(req.headers["range"], stats.size);
            if (range) {
                res.setHeader("Content-Range", "bytes " + range.start + "-" + range.end + "/" + stats.size);
                res.setHeader("Content-Length", (range.end - range.start + 1));
                var raw = fs.createReadStream(realPath, {
                    "start": range.start,
                    "end": range.end
                });
                compressHandle(raw, 206, "Partial Content");
            } else {
                res.removeHeader("Content-Length");
                res.writeHead(416, "Request Range Not Satisfiable");
                res.end();
            }
        } else {
            let expires = new Date();
            expires.setTime(expires.getTime() + 1000 * 1000);
            res.writeHead(200, {
                "Content-Type": "text/html",
                "content-encoding": "gzip",
                "Expires": expires.toUTCString(),
                "Cache-Control": "max-age=3000",
            });
            const inStream = new Readable();
            inStream.push(index(pictures));
            inStream.push(null); // 没有更多数据了
            inStream.pipe(zlib.createGzip()).pipe(res);
            //res.writeHead(200, { "Content-Type": "text/html" });
            //res.end(index(pictures)); //传递基于dist目录的图片数组
        }
    })
}

//处理显示图片
function resImage(req, res) {
    let readPath = __dirname + req.url;
    fs.exists(readPath, function (exists) {
        if (!exists) {
            res.writeHead(404, {
                'Content-Type': 'text/plain'
            });
            res.end();
        } else {
            res.writeHead(200, { "Content-Type": "image/jpg" });
            fs.createReadStream(readPath).pipe(res);
        }
    })
}

//下载
function download(req, res) {
    let query_string = url.parse(req.url).query;
    let _query_string = query_string && querystring.parse(query_string)
    let pictures = _query_string.picture;
    let file_array = [];
    if (Array.isArray(pictures)) {
        file_array = pictures;
    } else {
        file_array.push(pictures);
    }
    if (!pictures || file_array.length === 0) {
        return res.end('no files download');
    }
    res.writeHead(200, {
        "Content-type": "application/octet-stream",  //配置下载
        "Content-Disposition": "attachment;filename=" + encodeURI('picture.zip') //下载文件名
    });
    file_array = file_array.map(file => {
        return path.resolve('dist', file);
    })
    let exePath = 'zip';
    let params = ['-r', '-'];
    params = params.concat(file_array)
    let file_array_toString = file_array.join(' ');
    const zipProc = spawn(exePath, params)  //子进程调用linux zip命令压缩后 数据流输入到stdout
    zipProc.stdout.pipe(res)
    zipProc.stderr.on('data', function (data) {
        console.log(data.toString())
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.end();
    })
    zipProc.on('close', function (code) {
        console.log(code)
    })
}

//断点续载范围处理
function parseRange(str, size) {
    if (str.indexOf(",") != -1) {
        return;
    }
    var range = str.split("-"),
        start = parseInt(range[0], 10),
        end = parseInt(range[1], 10);
    // Case: -100
    if (isNaN(start)) {
        start = size - end;
        end = size - 1;
        // Case: 100-
    } else if (isNaN(end)) {
        end = size - 1;
    }
    // Invalid
    if (isNaN(start) || isNaN(end) || start > end || end > size) {
        return;
    }
    return {
        start: start,
        end: end
    };
}