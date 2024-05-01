// delete jpg files from root folder
var fs = require('fs');
var path = require('path');
fs.readdirSync(__dirname).forEach(file => {
    if (file.endsWith(".jpg" || ".png" || ".svg" || ".webp" || ".avif" || ".gif" || ".jpeg")) {
        fs.unlinkSync(path.join(__dirname, file));
    }
});
