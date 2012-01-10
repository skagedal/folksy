webengine = index.html folkesfolk.js js/

all: doc

updoc: doc
	cp README.html TODO.html ~/public_html/folkesfolk/

doc: README.html TODO.html

%.html: %.txt
	asciidoc $<

test:
ifndef FOLKSY_WEBROOT
	@echo "Please set FOLKSY_WEBROOT to install target"
endif

