#!/bin/bash

# Lame way of updating documentation
# git cherry-pick <commit> might be a better solution

git checkout master -- ./
git reset ./
git checkout gh-pages -- .gitignore
git clean -fd
git commit -av
