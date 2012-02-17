#!/usr/bin/python
# -*- coding: utf-8 -*-
#
#   This file is part of Folksy, a framework for educational games.
#
#   Folksy is free software: you can redistribute it and/or modify
#   it under the terms of the GNU General Public License as published by
#   the Free Software Foundation, either version 3 of the License, or
#   (at your option) any later version.
#
#   Folksy is distributed in the hope that it will be useful,
#   but WITHOUT ANY WARRANTY; without even the implied warranty of
#   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#   GNU General Public License for more details.
#
#   You should have received a copy of the GNU General Public License
#   along with Folksy.  If not, see <http://www.gnu.org/licenses/>.

import sys
sys.path = ['..'] + sys.path
from buildsupport import *

# We overwrite this, assuming we want to build the shipped games with
# the shipped theme.
themedir = path.abspath(path.join(path.pardir, 'themes'))
os.environ["FOLKSY_THEMEPATH"] = themedir 

subdirs = ["en_alphabet"]
# subdirs = subdirectories() 

folksy = "../../gametool/folksy.py"

def build():
    for subdir in subdirs:
        call_in_dir(subdir, [folksy, "build"])

def clean():
    for subdir in subdirs:
        call_in_dir(subdir, [folksy, "clean"])

def semiclean():
    for subdir in subdirs:
        call_in_dir(subdir, [folksy, "semiclean"])

main()
