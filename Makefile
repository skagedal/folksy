all: doc

doc: README.html TODO.html

%.html: %.txt
	asciidoc $<


