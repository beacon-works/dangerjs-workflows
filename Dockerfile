FROM node:10-slim

LABEL com.github.actions.name="Beacon Works Danger Action"
LABEL com.bithub.actions.description="Lint your Javascript projects with inline lint error annotations on pull requests."
LABEL com.github.actions.icon="code"
LABEL com.github.actions.color="blue"

COPY lib /action/lib
ENTRYPOINT ["/action/lib/entrypoint.sh"]