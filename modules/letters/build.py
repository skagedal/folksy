#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
sys.path = ['../..'] + sys.path
from buildsupport import *

def build():
    run("../../gametool/makeletters.py")

main()
