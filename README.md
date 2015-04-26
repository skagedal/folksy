Folksy
======

Folksy is a framework for creating simple educational games that run
in the browser, on your mobile phone, or anywhere else where you have
a game engine that supports the simple format. At least that's the
idea. That's part of the idea.

The games have a basic simple form: presented with a *stimulus*, A—an
image or a sound, or both—the user should respond with choosing
another stimulus, B, thus learning a relation between A and B.

Folksy is free software, the code distributed for the most part under
the [GNU General Public License][1]; see each source file. Some of the
content is distributed under a [CC-BY-SA][2] license.

See the doc directory for more information. The code is managed [at
GitHub](https://github.com/skagedal/folksy)—happy forking!

## Build depencies:

Install these Ubuntu packages:

* asciidoc
* python-yaml
* python-beautifulsoup
* python-simplemediawiki
* python-iso8601
* libav-tools (or ffmpeg, if available)

Then install the `usecommons` package from git:

    git clone https://github.com/skagedal/usecommons.git
    cd usecommons
    python ./setup.py install
    # add --user to install as user site-package; see --help
    # for other installation options.

Then run build.py.

Simon Kågedal Reimer <simon@kagedal.org>

  [1]: http://www.gnu.org/copyleft/gpl.html "GNU General Public License"
  [2]: http://creativecommons.org/licenses/by-sa/3.0/

