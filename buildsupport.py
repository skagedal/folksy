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

from fabricate import *
import sys, os, os.path as path, subprocess
from distutils.dir_util import mkpath

try:
    from buildsettings import buildsettings
except:
    buildsettings = {}

def in_dir(dir, fun, *args, **kwargs):
    """Execute the function `fun` in the directory `dir`, passing on
    extra arguments and keyword arguments."""
    cwd = os.getcwd()
    os.chdir(dir)
    fun(*args, **kwargs)
    os.chdir(cwd)

def run_in_dir(dir, *args, **kwargs):
    """Do a memoized `run` of a command in a specified directory."""
    in_dir(dir, run, *args, **kwargs)

def call_in_dir(dir, *args, **kwargs):
    """A subprocess call of a command, i.e. without memoization."""
    in_dir(dir, subprocess.call, *args, **kwargs)

def recurse(dir, action=None):
    if action is None:
        args = sys.argv[1:]
    else:
        args = [action]
    call_in_dir(dir, ["./build.py"] + args)

def subdirectories(dir = None):
    # This function is also in folksy.py.
    if (dir is None):
        dir = os.getcwd()
    for entry in os.listdir(dir):
        if path.isdir(path.join(dir, entry)):
            yield entry

def vcall(lst, *args, **kwargs):
    """ "Verbose call" """
    print(" ".join(lst))
    subprocess.call(lst, *args, **kwargs)


def download(url, target):
    raise Exception("can't download files yet; download %s to %s" % (url, target))
