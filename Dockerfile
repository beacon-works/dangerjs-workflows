FROM node:slim

LABEL "com.github.actions.name"="beacon-works/dangerjs"
LABEL "com.github.actions.description"="run dangerjs pr checks"
LABEL "com.github.actions.icon"="mic"
LABEL "com.github.actions.color"="blue"


ADD entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]