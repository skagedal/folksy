#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
import glob
sys.path = ['../../../..'] + sys.path
from buildsupport import *

sources = glob.glob('*.ogg')

def build():
    for source in sources:
        run('ffmpeg', '-y', '-i', source, path.splitext(source)[0] + '.mp3')

def clean():
    autoclean()

def fromgcompris():
    # Variables to modify
    gcompris_version = '12.01'
    files = ['awesome.ogg', 'congratulation.ogg', 'fantastic.ogg',
             'good.ogg', 'great.ogg', 'perfect.ogg', 'super.ogg',
             'waytogo.ogg']
    langs = ['en', 'sv']

    project = 'gcompris-' + gcompris_version
    tgz_file = project + '.tar.gz'
    url = 'http://sourceforge.net/projects/gcompris/files/%s/%s/download' % \
          (gcompris_version, tgz_file)
    unpack = '%s/boards/voices/' % project
    if not path.isdir(project):
        if not path.isfile(tgz_file):
            download(url, tgz_file)
        vcall(['tar', 'xf', tgz_file, unpack])
    
    for lang in langs:
        mkpath(lang)
        for file in files:
            vcall(['cp', '%s/boards/voices/%s/misc/%s' % (project,
                                                          lang, file),
                   lang])
                                                        

main()
