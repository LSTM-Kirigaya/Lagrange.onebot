rm -r publish
mkdir -p publish
cp -r dist/* publish/
cp README.md publish/
cp package.json publish/