# action-github-app-token-config

This action step allows you to clone and use private git repositories from the same and 
other organizations in a Github Action.

## Prior Art

The normal GITHUB_TOKEN only allows access to the current repository of an action.

Using a personal access token works, but gives the Action access to every repository 
that you have access to, and is bad practice for sharing with collaborators.

Using a Machine User SSH token works, but requires buying additional licenses 
and may necessitate adding a Deploy token to every repository you need to access making
key rotation hard.

The approach used here is to set up a Github App which has finely scoped privileges with
access to entire organizations or specific repositories, and has higher rate limits for using
the Github API.

This action step use the Github App Id and Private Key (supplied as inputs / secrets) to 
first retrieve all the installations of the app, then gets the token associated with each
installation (organization scope), and then sets the global Git configuration to use https 
access instead of SSH access with the token used as the Git password.   The tokens are set as 
github action secrets so that they don't leak to the log files.

- [getsentry/action-github-app-token](https://github.com/getsentry/action-github-app-token) by Sentry provided the basis for this action;  we enhanced it to process all scopes without prior knowledge instead of one known scope at a time, and to
automatically set the git configuration for each token instead of passing back a single token. 
- [OleksiyRudenko/gha-git-credentials](https://github.com/OleksiyRudenko/gha-git-credentials) sets git credentials, 
but does not map SSH to HTTPS and is more focused on user and password usage.

## Development

Install the dependencies
```bash
$ yarn
```

Build the typescript and package it for distribution
```bash
$ yarn dist
```

## Usage

You will need to provide the GitHub App ID and private key. 

```
  - name: my-app-install token
    id: my-app
    uses: getsentry/action-github-app-token@v1
    with:
      app_id: ${{ secrets.APP_ID }}
      private_key: ${{ secrets.APP_PRIVATE_KEY }}
```


## License

MIT