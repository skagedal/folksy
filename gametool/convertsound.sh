#!/bin/sh
for i in *.ogg
	do ffmpeg -y -i $i `basename $i .ogg`.mp3
done

