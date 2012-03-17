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

FOLKSY_GAMEPATH: Here's where we look for games [TODO: change this
system to basic regular work-on-this-file]
FOLKSY_MODULEPATH: Here's where we look for modules/themes. 
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
import yaml, usecommons
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
# Various helpers
#

def merge_dicts(*args):
    """Merge a bunch of dictionaries into one, later dicts overriding 
    earlier. Example: 
    merge_dicts({'a': 1, 'b': 3}, {'b': 5}) == {'a': 1, 'b': 5}
    """
    return reduce(lambda x,y: dict(x.items() + y.items()), args)

def _flatten_list(lst):
    return sum(lst, [])

def _extract_json_fields(json, field):
    """Return a list of all dict fields named `field` and remove them from
       the json."""
    def recurse(json):
        if isinstance(json, list):
            return _flatten_list(map(recurse, json))
        elif isinstance(json, dict):
            ret = []
            if field in json:
                ret = [json[field]]
                del json[field]
            ret += _flatten_list(map(recurse, json.values()))
            return ret
        return []
    return recurse(json)
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
        if (isinstance (sources, str) or isinstance(sources, unicode)):
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
    def __init__(self, game, sources, target, 
                 crop=None, scale=None, image=None):
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
                    "json_loc": self.game.get_json_filename(),
                    "description": self.game.description}
        fhtml = FolksyHtml(self.game.lang, gamevars)
        content = unicode(open(self.sources[0], "r").read(), "utf-8")
        open(self.target, "w").write(fhtml.substitute(content).encode("utf-8"))
        debug("wrote html file")

class Module:
    """A _module_ is a reusable piece of a Folksy game. One particular 
    module is the _theme_."""
    def __init__(self, _folksy, _module_id, _path):
        self.folksy = _folksy
        self.module_id = _module_id
        self.path = _path
        self.yaml = None

    # FIXME - currently a hack; should be loaded like any module.
    def letter_json(self, letter):
        json = {}
        json["text"] = letter
        json["id"] = "letter_" + letter
        kwords = { "prefix": self.folksy.href_prefix,
                   "module": self.module_id, 
                   "letter": unicodedata.name(letter).replace(" ", "_")}
        json["image_src"] = \
            "{prefix}modules/letters/{letter}.png".format(**kwords)
        json["image_select_src"] = \
            "{prefix}modules/letters/{letter}_select.png".format(**kwords)
        filename = kwords["letter"] + ".png"
        return json

    def load_json(self, lang = None):
        """Load a json file associated with the module. First try a
language specific file (if `lang` is specified), otherwise use module.json."""
        def load_json_file(file):
            try:
                return json.load(open(file, "r"))
            except IOError:
                return None
        json_obj = None
        if lang is not None:
            json_obj = load_json_file(path.join(self.path, lang + '.json'))
        if json_obj is None:
            json_obj = load_json_file(path.join(self.path, 'module.json'))
        return json_obj

class Game:
    def __init__(self, _folksy, _game_id, _path):
        self.folksy = _folksy
        self.game_id = _game_id # TODO: should check if valid id i.e. [A-Za-z_]
        self.path = _path
        self.buildpath = path.join(self.path, "gamebuild")
        self.yaml = None        # not loaded
        self._commons = None

    def commons(self):
        if self._commons is None:
            self._commons = usecommons.Commons()
        return self._commons

    def load_modules(self):
        if 'modules' in self.yaml:
            for module in self.yaml['modules']:
                module_json = self.folksy.modules[module].load_json(self.lang)
                if module_json is not None:
                    self.json = merge_dicts(module_json, self.json)

    def load(self):
        """Load game.yaml file"""
        try:
            gameyaml = path.join(self.path, "game.yaml")
            self.yaml = yaml.load(open(gameyaml).read())
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
        self.theme = self.folksy.modules[themename]

        locale_lang = locale.getdefaultlocale()[0].split('_')[0].lower()
        self.lang = self.yaml.get("lang", locale_lang)
        # We could check if lang is valid with pycountry. Do we want to?

    def show_info(self):
        print ("id:           " + self.game_id)
        print ("path:         " + self.path)
        print ("name:         " + self.name)
        print ("gametype:     " + str(self.gametype))
        print ("theme:        " + self.theme.module_id)
        print ("lang:         " + self.lang)

    def find_media_file(self, subdir, base, extensions):
        for ext in extensions:
            if path.isfile(path.join(self.path, subdir, base + ext)):
                 return path.join(subdir, base + ext)
        return None

    def get_json_filename(self):
        return "%s.json" % self.game_id

    def get_path_json(self):
        return path.join(self.buildpath, self.get_json_filename())

    def get_path_indexhtml(self):
        return path.join(self.buildpath, "index.html")

    def get_image_default_width(self):
        return self.yaml.get('imagewidth', 500)

    def fetch_media_file(self, source):
        if source.startswith('commons:'):
            title = source[len('commons:'):]
            commons = self.commons()
            print('Fetch %s' % title)
            cfile = commons.get(u'File:' + title,
                                download = True,
                                width = self.get_image_default_width())
            return cfile.filename, cfile.attribution()
        elif re.match('^https?:', source):
            assert False, 'Fixme: Download'
        return None, None

    def build_item(self, y_item):
        """Prepare media files for an item. y_item is the input from
           YAML file. Return JSON."""
        j_item = {}
        try:
            j_item["id"] = y_item["id"]
        except KeyError:
            warning("item without an id in YAML file; skipping")
            return None

        # If explicitly specified, fetch that resource. Otherwise,
        # see if there's an image file in images/ with this id as name.
        img_credit = ''
        if 'image' in y_item:
            source = y_item['image']
            img_filename, img_credit = self.fetch_media_file(source)
        else:
            img_filename = self.find_media_file(
                "images", y_item["id"], FolksyOptions["image_extensions"])
        if 'image_credit' in y_item:
            img_credit = y_item['image_credit']

        if img_filename is not None:
            source_path = path.join(self.path, img_filename)
            dest = path.join('images', path.basename(img_filename))
            dest_path = path.join(self.buildpath, dest)
            debug('Copy %s to %s' % (source_path, dest_path))
            try:
                # Should later use ImageBuildRule
                CopyBuildRule(self, source_path, dest_path).rebuild()
            except IOError as e:
                warning("image file %s: %s; skipping item" % \
                            (e.filename, e.strerror)) 
                #fixme lousy error message
                return None
            j_item["image_src"] = dest
            j_item['image_credit'] = (dest, img_credit)
        else:
            warning("no image file for item %s; skipping" % y_item["id"])
            return None

        # Find sound.
        snd_credit = ''
        if 'sound' in y_item:
            source = y_item['sound']
            snd_filename, snd_credit = self.fetch_media_file(source)
        else:
            snd_filename = self.find_media_file(
                "sounds", y_item["id"], FolksyOptions["sound_extensions"])
        if 'sound_credit' in y_item:
            snd_credit = y_item['sound_credit']

        if snd_filename is not None:
            snd_src_filepath = path.join(self.path, snd_filename)
            dest = path.join('sounds', path.basename(snd_filename))
            snd_dest_base = path.splitext(dest)[0]
            oggpath = path.join(self.buildpath, snd_dest_base + ".ogg")
            mp3path = path.join(self.buildpath, snd_dest_base + ".mp3")
            try:
                SoundBuildRule(self, snd_src_filepath, oggpath).rebuild()
                SoundBuildRule(self, snd_src_filepath, mp3path).rebuild()
            except IOError as e:
                warning("sound file %s: %s; skipping item" % \
                            (e.filename, e.strerror))
                #fixme lousy error message
                return None

            j_item["sound_srcs"] = [snd_dest_base + ".ogg",
                                    snd_dest_base + ".mp3"]
            j_item['sound_credit'] = (dest, snd_credit)
        else:
            warning("no sound file for item %s; skipping" % y_item["id"])
            return None

        # Find letter, or deduce from id
        letter_from_id = re.match("^([^_]*)", y_item["id"]).group(0)
        j_item["text"] = unicode(y_item.get("letter", letter_from_id))

        return j_item

    def extract_credits(self, json):
        def deflist(credits):
            s = '<dl>\n'
            for (filename, credit) in credits:
                s += \
                    ('  <dt class="filename">%s</dt>\n' + 
                     '  <dd class="credit">%s</dd>\n') % (filename, credit)
            s += '</dl>\n'
            return s
        credits = ''
        image_credits = _extract_json_fields(json, 'image_credit')
        sound_credits = _extract_json_fields(json, 'sound_credit')
        credits += '<h3>Image credits</h3>\n' + deflist(image_credits)
        credits += '<h3>Sound credits</h3>\n' + deflist(sound_credits)
        return credits

    def build(self):
        """Build the game. Prepare all the media files, create a json
           file that describes the game and a index.html."""

        # This is the stuff that will get dumped to the json file.
        self.json = {}

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

        # Process items. This code is really specific for gametype ==
        # "whatletter".  We'll see what happens.
        self.json['items'] = []
        
        stimuli = []
        for y_item in self.yaml["items"]:
            j_item = self.build_item(y_item)
            if j_item is not None:
                stimuli.append(j_item)

        credits = self.extract_credits(stimuli)

        # TODO: rename faces --> prompts
        self.json['stimulus_sets'].append({"stimuli": stimuli, "id": "faces"})
        self.json['credits'] = credits

        # Letter images. From theme.
        letters = uniqify([s["text"] for s in stimuli])
        letter_stimuli = [self.theme.letter_json(letter) for letter in letters]
        self.json['stimulus_sets'].append(
            {"stimuli": letter_stimuli, "id": "letters"})

        # A relation is composed of _pairs_ of stimuli
        pairs = [{"A": s["id"], "B": "letter_" + s["text"]} for s in stimuli]
        self.json['relations'] = [{"A": "faces", 
                                   "B": "letters", 
                                   "pairs": pairs}]

        self.load_modules()

        # TODO: the pretty-printing (indent) should be settable,
        # production mode should be no pretty-print?
        json.dump(self.json, open(self.get_path_json(), "w"), indent = 4)

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
            HtmlBuildRule(self, template, self.get_path_indexhtml()).rebuild()

class GameType:
    def __init__(self, _id):
        self.id = _id

    def __str__(self):
        return self.id



class FolksyTool:
    gamepaths = []
    games = {}
    modulepaths = []
    modules = {}
    gametypes = {}

    def __init__(self):
        self.setup_gamepaths()
        self.setup_modulepaths()
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

    def setup_modulepaths(self):
        self.modulepaths += self.get_environ_path("FOLKSY_MODULEPATH")

        for p in self.modulepaths:
            try:
                for module in subdirectories(p):
                    if not module.startswith("."):
                        self.modules[module] = Module(self, module, 
                                                      path.join(p, module))
            except OSError as e:
                warning("%s: %s" % (e.filename, e.strerror))

    def get_default_theme(self):
        return "basic"

    def is_valid_theme(self, theme):
        return theme in self.modules

    def list_games(self):
        for name in self.games:
            print (name)

    def list_modules(self):
        for name in self.modules:
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

    def clean(self):
        pass

    def semiclean(self):
        game_id = path.split(os.getcwd())[1]
        game = Game(self, game_id, os.getcwd())
        print ("rm %s" % game.get_path_json())
        subprocess.call(["rm", game.get_path_json()])
        print ("rm %s" % game.get_path_indexhtml())
        subprocess.call(["rm", game.get_path_indexhtml()])
        
    def configure(self):
        if not FolksyConfig["HAVE_PIL"]:
            warning("Python Imaging Library is not installed; " + 
                    "no image manipulations will be performed.")
        return True

    def main(self):
        parser = OptionParser()

        #parser.add_option("-h", "--help", help="get help")
        parser.add_option("-d", "--set-game-dir", 
                          help="set game directory to DIR",
                          dest="game_dir", metavar="DIR")
        parser.add_option("--pretty-json", dest="pretty_json",
                          help="pretty-print outputted JSON")
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
            elif (command == "modules"):
                self.list_modules()
            elif (command == "build"):
                if (len(args) > 0):
                    game = pop_first(args)
                    self.build_game(game)
                else:
                    self.build_game_cwd()
            elif (command == "clean"):
                self.clean()
            elif (command == "semiclean"):
                self.semiclean()
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

