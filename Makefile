all: doc

updoc: doc
	cp README.html TODO.html ~/public_html/folkesfolk/

doc: README.html TODO.html

%.html: %.txt
	asciidoc $<


