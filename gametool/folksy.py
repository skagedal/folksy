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
#

"""
The following environment variables are used:

FOLKSY_GAMEPATH: Here's where we look for games [TODO: change this system to basic regular work-on-this-file]
FOLKSY_THEMEPATH: Here's where we look for themes. 
FOLKSY_HREF_PREFIX: To put before common Folksy files in URL:s.

Colon separated. (on Unix, semi-colon on Windows I guess.)
"""

FolksyConfig = {
    "HAVE_PIL": True
    }

# Want this to keep working with both Python 2.6 and Python 2.7.

import sys, os, os.path as path, subprocess, json, locale, re
import distutils.dir_util, unicodedata, shutil
from optparse import OptionParser
mkpath = distutils.dir_util.mkpath

# non-standard libraries
import yaml
try:
    import PIL.Image
except ImportError:
    FolksyConfig["HAVE_PIL"] = False

#import pycountry

# own libraries
from folksyhtml import FolksyHtml

FolksyOptions = {
    "image_extensions": [".jpg", ".jpeg", ".JPG", ".png", ".PNG", ".gif"],
    "sound_extensions": [".flac", ".wav", ".ogg", ".mp3"]
}


#
# Exceptions
#

class GameTypeError(Exception):
    def __init__(self, value):
        self.value = value
    def __str__(self):
        return repr(self.value)

class GameLoadError(Exception):
    def __init__(self, value):
        self.value = value
    def __str__(self):
        return repr(self.value)

#
# Classes
#

class BuildRule:
    """This is a tiny "make" system. A subclass of this class
    defines a recipe to build a type of file."""
    def __init__(self, game, sources, target):
        """`sources` should be either a list of prerequisites or just 
        one prerequisite as a string. `target` is the the file to update. 
        Files should be given with full paths.

        Sometimes many files should be checked as prerequisites but
        only file is the "source". That should then be the first element
        of the list.
        """
        self.game = game
        if (isinstance (sources, str)):
            self.sources = [sources]
        else:
            self.sources = sources
        self.target = target

    def run(self):
        """Override this!"""
        raise Exception("need to subclass BuildRule")

    def needs_rebuild(self):
        try:
            target_mtime = path.getmtime(self.target)
        except OSError:
            return True
        for src in self.sources:
            if (path.getmtime(src) > target_mtime):
                return True
        return False

    def rebuild(self):
        """Run the build rule if necessary"""
        mkpath(path.dirname(self.target))
        if (self.needs_rebuild()):
            self.run()

class CopyBuildRule(BuildRule):
    def __init__(self, game, sources, target):
        BuildRule.__init__(self, game, sources, target)

    def run(self):
        shutil.copyfile(self.sources[0], self.target)

class ImageBuildRule(BuildRule):
    def __init__(self, game, sources, target, crop=None, scale=None, image=None):
        """`crop`, if given, should be a 4-tuple, (left, upper, right, lower)
        `resize`, if given, should be a 2-tuple, (width, height)"""
        BuildRule.__init__(self, game, sources, target)
        self.crop = crop
        self.scale = scale
        self.image = image

    def run(self):
        if not FolksyConfig["HAVE_PIL"]:
            CopyBuildRule.run(self)
        if self.image is None:
            self.image = PIL.Image.open(self.sources[0])
        if self.crop is not None:
            self.image.crop(self.crop)
        if self.scale is not None:
            self.image.resize(self.scale)
        image.save(self.target)

class SoundBuildRule(BuildRule):
    def __init__(self, game, sources, target):
        BuildRule.__init__(self, game, sources, target)

    def run(self):
        target_ext = get_ext(self.target).lower()
        if (get_ext(self.sources[0]).lower() == target_ext):
            shutil.copyfile(self.sources[0], self.target)
        else:
            subprocess.call(["ffmpeg", 
                             "-y",                    # overwrite output file
                             "-i", self.sources[0],   # set input file
                             "-acodec", "libvorbis",  # FIXME!
                             self.target])

class HtmlBuildRule(BuildRule):
    """Build a index.html from a template file"""
    def __init__(self, game, sources, target):
        BuildRule.__init__(self, game, sources, target)

    def run(self):
        gamevars = {"name": self.game.name, 
                    "json_loc": self.game.json_loc,
                    "description": self.game.description}
        fhtml = FolksyHtml(self.game.lang, gamevars)
        content = unicode(open(self.sources[0], "r").read(), "utf-8")
        open(self.target, "w").write(fhtml.substitute(content).encode("utf-8"))
        debug("wrote html file")

class Theme:
    def __init__(self, _folksy, _theme_id, _path):
        self.folksy = _folksy
        self.theme_id = _theme_id
        self.path = _path
        self.yaml = None

    def letter_json(self, letter):
        json = {}
        json["text"] = letter
        json["id"] = "letter_" + letter
        kwords = { "prefix": self.folksy.href_prefix,
                   "theme": self.theme_id, 
                   "letter": unicodedata.name(letter).replace(" ", "_")}
        json["image_src"] = "{prefix}themes/{theme}/letters/{letter}.png".format(**kwords)
        json["image_select_src"] = "{prefix}themes/{theme}/letters/{letter}_select.png".format(**kwords)
        filename = kwords["letter"] + ".png"
        return json
        
class Game:
    def __init__(self, _folksy, _game_id, _path):
        self.folksy = _folksy
        self.game_id = _game_id # TODO: should check if valid id i.e. [A-Za-z_]
        self.path = _path
        self.yaml = None        # not loaded

    def load(self):
        try:
            self.yaml = yaml.load(open(path.join(self.path, "game.yaml")).read())
        except IOError as e:
            raise GameLoadError("couldn't open game.yaml file: " + str(e))
        except yaml.YAMLError as e:
            raise GameLoadError("couldn't parse YAML: " + str(e))

        self.name = self.yaml.get("name", "<untitled>")
        self.description = self.yaml.get("description", "")

        try:
            self.gametype = self.folksy.get_gametype(self.yaml["gametype"])
        except KeyError:
            raise GameLoadError("game has no gametype")
        except GameTypeError as e:
            raise GameLoadError(e.value)

        themename = self.yaml.get("theme", self.folksy.get_default_theme())
        if not self.folksy.is_valid_theme(themename):
            raise GameLoadError("not a valid %s theme: %s" % (self.gametype, 
                                                              themename))
        self.theme = self.folksy.themes[themename]

        self.lang = self.yaml.get("lang", locale.getdefaultlocale()[0].split('_')[0].lower())
        # We could check if lang is valid with pycountry. Do we want to?

    def show_info(self):
        print ("id:           " + self.game_id)
        print ("path:         " + self.path)
        print ("name:         " + self.name)
        print ("gametype:     " + str(self.gametype))
        print ("theme:        " + self.theme.theme_id)
        print ("lang:         " + self.lang)

    def find_media_file(self, subdir, base, extensions):
        for ext in extensions:
            if path.isfile(path.join(self.path, subdir, base + ext)):
                 return path.join(subdir, base + ext)
        return None


    def build(self):
        # This is the stuff that will get dumped to the json file.
        self.json = {}

        # self.buildpath = path.join(self.folksy.buildpath, self.game_id)
        self.buildpath = path.join(self.path, "gamebuild")
        print("building in:   " + self.buildpath)
        try:
            mkpath(self.buildpath)
        except distutils.DistutilsFileError as e:
            raise GameBuildError("couldn't create build path " + self.buildpath)

        self.json['id'] = self.game_id
        self.json['name'] = self.name
        self.json['format'] = 1
        self.json['gametype'] = str(self.gametype)
        self.json['gametype_format'] = 1
        self.json['lang'] = self.lang

        self.json['stimulus_sets'] = []
        # Process items. This code is really specific for gametype == "whatletter".
        # We'll see what happens.
        self.json['items'] = []
        
        stimuli = []
        for y_item in self.yaml["items"]:
            j_item = {}
            try:
                j_item["id"] = y_item["id"]
            except KeyError:
                warning("item without an id in YAML file; skipping")
                continue

            # Find image file. #fixme: if specified in YAML, use that!
            img_filename = self.find_media_file("images", y_item["id"], FolksyOptions["image_extensions"])
            if img_filename is not None:
                img_src_filepath = path.join(self.path, img_filename)

                try:
                    # Should later use ImageBuildRule
                    CopyBuildRule(self, img_src_filepath, path.join(self.buildpath, img_filename)).rebuild()
                except IOError as e:
                    warning("%s: %s; skipping item" % (e.filename, e.strerror)) #fixme lousy error message
                    continue
                j_item["image_src"] = img_filename
            else:
                warning("no image file for item %s; skipping" % y_item["id"])
                continue
            
            # Find sound.
            snd_filename = self.find_media_file("sounds", y_item["id"], FolksyOptions["sound_extensions"])
            # debug(snd_filename)
            if snd_filename is not None:
                snd_src_filepath = path.join(self.path, snd_filename)
                snd_dest_base = path.splitext(snd_filename)[0]
                oggpath = path.join(self.buildpath, snd_dest_base + ".ogg")
                mp3path = path.join(self.buildpath, snd_dest_base + ".mp3")
                try:
                    # debug("Build %s to %s and %s" % (snd_src_filepath, oggpath, mp3path))
                    SoundBuildRule(self, snd_src_filepath, oggpath).rebuild()
                    SoundBuildRule(self, snd_src_filepath, mp3path).rebuild()
                except IOError as e:
                    warning("%s: %s; skipping item" % (e.filename, e.strerror)) #fixme lousy error message
                    continue

                #j_item["sound_ogg"] = snd_dest_base + ".ogg"
                #j_item["sound_mp3"] = snd_dest_base + ".mp3"
                j_item["sound_srcs"] = [snd_dest_base + ".ogg",
                                        snd_dest_base + ".mp3"]
            else:
                warning("no sound file for item %s; skipping" % y_item["id"])
                continue

            # Find letter, or deduce from id
            j_item["text"] = unicode(y_item.get("letter", re.match("^([^_]*)", y_item["id"]).group(0)))
            
            # All done with the item. Add it to JSON output.
            stimuli.append(j_item)

        self.json['stimulus_sets'].append({"stimuli": stimuli, "id": "faces"})

        # Letter images. From theme.
        letters = uniqify([s["text"] for s in stimuli])
        letter_stimuli = [self.theme.letter_json(letter) for letter in letters]
        self.json['stimulus_sets'].append({"stimuli": letter_stimuli, "id": "letters"})

        # A relation is composed of _edges_ between node A and node B (the stimuli)
        edges = [{"A": s["id"], "B": "letter_" + s["text"]} for s in stimuli]
        self.json['relations'] = [{"A": "faces", 
                                   "B": "letters", 
                                   "edges": edges}]

        # Dump JSON.
        self.json_loc = "%s.json" % self.game_id                # also used for html template 
        filename = path.join(self.buildpath, self.json_loc)
        # TODO: the pretty-printing (indent) should be settable, production mode should be no pretty-print?
        json.dump(self.json, open(filename, "w"), indent = 4)

        # Build html
        template = ""
        if "template" in self.yaml:
            template = path.join(self.path, self.yaml["template"])
        else:
            template = path.join(self.theme.path, self.lang + ".template")
            if not path.isfile(template):
                template = path.join(self.theme.path, "index.template")

        if path.isfile(template):
            debug("template file: " + template)
            HtmlBuildRule(self, template, path.join(self.buildpath, "index.html")).rebuild()

class GameType:
    def __init__(self, _id):
        self.id = _id

    def __str__(self):
        return self.id



class FolksyTool:
    gamepaths = []
    games = {}
    themepaths = []
    themes = {}
    gametypes = {}
    buildpath = ""

    def __init__(self):
        self.setup_gamepaths()
        self.setup_themepaths()
        self.setup_buildpath()
        self.setup_gametypes()
        self.href_prefix = os.environ.get("FOLKSY_HREF_PREFIX", "")

    def setup_gametypes(self):
        gametype = GameType("whatletter")
        self.gametypes["whatletter"] = gametype

    # Class method
    def get_gametype(self, s):
        try:
            return self.gametypes[s]
        except KeyError:
            raise GameTypeError("not a valid gametype: " + s)

    def is_valid_gametype(g):
        # Only one so far...
        return g == "whatletter"

    def get_environ_path(self, var):
        if os.environ.has_key(var):
            return os.environ[var].split(os.pathsep)
        else:
            return []

    def setup_gamepaths(self):
        # There should also be some default paths
        self.gamepaths += self.get_environ_path("FOLKSY_GAMEPATH")

        for p in self.gamepaths:
            try:
                for game in subdirectories(p):
                    if not game.startswith("."):
                        self.games[game] = Game(self, game, path.join(p, game))
            except OSError as e:
                warning("%s: %s" % (e.filename, e.strerror))

    def setup_themepaths(self):
        self.themepaths += self.get_environ_path("FOLKSY_THEMEPATH")

        for p in self.themepaths:
            try:
                for theme in subdirectories(p):
                    if not theme.startswith("."):
                        self.themes[theme] = Theme(self, theme, path.join(p, theme))
            except OSError as e:
                warning("%s: %s" % (e.filename, e.strerror))

    def setup_buildpath(self):
        # TODO: should of course be settable in all kinds of ways.
        self.buildpath = path.expanduser("~/.folksy/build")

    def get_default_theme(self):
        return "sunset"

    def is_valid_theme(self, theme):
        return theme in self.themes

    def list_games(self):
        for name in self.games:
            print (name)

    def list_themes(self):
        for name in self.themes:
            print (name)

    def build_game(self, game_name):
        try:
            game = self.games[game_name]
        except KeyError as e:
            error("%s: No such game." % game_name);
            return

        try:
            game.load()
        except GameLoadError as e:
            error("%s: %s" % (game_name, str(e)))
            return

        game.show_info()
        game.build()

    def build_game_cwd(self):
        game_id = path.split(os.getcwd())[1]
        game = Game(self, game_id, os.getcwd())
        try:
            game.load()
        except GameLoadError as e:
            error("%s: %s" % (game_id, str(e)))
            return

        game.show_info()
        game.build()
        
    def configure(self):
        if not FolksyConfig["HAVE_PIL"]:
            warning("Python Imaging Library is not installed; no image manipulations will be performed.")
        return True

    def main(self):
        parser = OptionParser()

        #parser.add_option("-h", "--help", help="get help")
        parser.add_option("-d", "--set-game-dir", help="set game directory to DIR",
                          dest="game_dir", metavar="DIR")
        parser.add_option("--pretty-json", help="pretty-print outputted JSON", dest="pretty_json")
        # TODO: actually care about these options...

        (options, args) = parser.parse_args()

        if not self.configure():
            return

        if (len(args) > 0):
            command = pop_first(args)

            if (command == "help"):
                print ("HERE: list all commmands");
            elif (command == "list"):
                self.list_games()
            elif (command == "themes"):
                self.list_themes()
            elif (command == "build"):
                if (len(args) > 0):
                    game = pop_first(args)
                    self.build_game(game)
                else:
                    self.build_game_cwd()
            else:
                print ("Unknown command: " + command)
        else:
            print ("Nothing to do. :-(");


#
# Utility functions.
#

def pop_first(array):
    element = array[0]
    del array[0]
    return element

def uniqify(seq):  
    # order preserving 
    checked = [] 
    for e in seq: 
        if e not in checked: 
            checked.append(e) 
    return checked

def warning(s):
    sys.stderr.write("WARNING: " + s + "\n")

Folksy_exit_code = 0
def error(s):
    global Folksy_exit_code
    Folksy_exit_code = 1
    sys.stderr.write("ERROR: " + s + "\n")
    
def debug(s):
    sys.stderr.write("DEBUG: " + str(s) + "\n")

def subdirectories(dir):
    for entry in os.listdir(dir):
        if path.isdir(path.join(dir, entry)):
            yield entry

def shell_command(cmd, extra_env):
    """Run a shell command. Extend environment with extra_env."""
    new_env = os.environ.copy()
    new_env.update(extra_env)
    return subprocess.call(cmd, env = new_env, shell = True)

def get_ext(s):
    return path.splitext(s)[1]

def get_image_size(filepath):
    if not FolksyConfig["HAVE_PIL"]:
        warning("Trying to get image size, but PIL is not installed.");
        return (0, 0)
    image = PIL.Image.open(filepath)
    return image.size

if __name__ == "__main__":
    FolksyTool().main()
    sys.exit(Folksy_exit_code)

