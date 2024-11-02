#!/bin/bash

PROJECT_DIR=$(pwd)
WEB_SRC=$PROJECT_DIR/src/web

echo Building first time...

source ./script/build_web.sh

echo Watching for changes in ./src/web

inotifywait -rme modify "$WEB_SRC" | 
    while read file_path file_event file_name; do 
        echo ${file_event}::${file_path}${file_name}
        echo Rebuilding...

        source ./script/build_web.sh
    done