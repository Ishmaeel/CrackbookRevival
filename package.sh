#!/bin/sh

git --no-pager grep console.log | grep -v package.sh
git --no-pager grep TODO | grep -v package.sh
git --no-pager grep XXX | grep -v package.sh

rm -f crackbook.zip
zip crackbook.zip manifest.json LICENSE README.md *.html *.js *.css images/*.png
