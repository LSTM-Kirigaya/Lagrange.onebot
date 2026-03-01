const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'qqbot-skills');
const dist = path.join(__dirname, '..', 'dist', 'qqbot-skills');

function copy(s, d) {
    fs.mkdirSync(d, { recursive: true });
    fs.readdirSync(s).forEach(f => {
        const sp = path.join(s, f);
        const dp = path.join(d, f);
        const stat = fs.statSync(sp);
        if (stat.isDirectory()) {
            copy(sp, dp);
        } else {
            fs.copyFileSync(sp, dp);
        }
    });
}

copy(src, dist);
console.log('Copied qqbot-skills to dist');
