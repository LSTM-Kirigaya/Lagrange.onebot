# sh pub.sh
# cd publish
# npm publish
tsc
rm -r publish
mkdir -p publish
cp -r dist/* publish/
cp README.md publish/
cp package.json publish/