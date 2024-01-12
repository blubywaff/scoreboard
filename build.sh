#!/bin/bash
mkdir dist
cp src/*.html dist/
npx tailwindcss -i ./src/index.css -o ./dist/index.css
npx tsc --outDir dist/
