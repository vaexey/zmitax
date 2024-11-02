#!/bin/bash

PROJECT_DIR=$(pwd)
WEB_SRC=$PROJECT_DIR/src/web
ASSET_SRC=$PROJECT_DIR/asset
STATIC_SRC=$PROJECT_DIR/static

FILES_TEXT=$(find ./src/web -name '*.html' -or -name '*.css' -or -name '*.js')
FILES_SCSS=$(find ./src/web -name '*.scss')

paths_of () {
    REL_FILE=$(realpath -s --relative-to="$WEB_SRC" "$1")

    SRC=$(realpath -s --relative-to="$PROJECT_DIR" "$WEB_SRC")/$REL_FILE
    DEST=$(realpath -s --relative-to="$PROJECT_DIR" "$STATIC_SRC")/$REL_FILE
}

echo Removing static files

rm -rfv $STATIC_SRC
mkdir $STATIC_SRC

echo Copying static files
for file in $FILES_TEXT;
do
    paths_of $file

    echo ":: ./$SRC -> ./$DEST"

    mkdir -p "$(dirname ./$DEST)"
    cp "$SRC" "$DEST"
done

echo Copying assets
cp -rv "$ASSET_SRC" "$STATIC_SRC/asset"

echo Compiling SASS
for file in $FILES_SCSS;
do
    paths_of $file
    DEST="$(dirname $DEST)/$(basename -- "$DEST" .scss).css"

    echo "\$\$ ./$SRC -> ./$DEST"

    mkdir -p "$(dirname ./$DEST)"
    npx sass "$SRC" "$DEST"
done