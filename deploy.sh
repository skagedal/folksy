#!/bin/bash

RSYNC="rsync -avz --progress --stats --cvs-exclude -n"
TARGET="simon@helgo.net:/home/simon/public_html/folksy"
BASE_FILES=`cat FILES`
$RSYNC $BASE_FILES $TARGET
