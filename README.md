# @avaragado/xstate-runner

::TODO::

*   licence
*   contribs

## Developer notes

The `package.json` file contains all the usual scripts for linting, testing, building and releasing.

Buzzwords: prettier, eslint, flow, flow-typed, babel, jest, rollup.

### Branches and merging

When merging to master **Squash and Merge**.

In the commit message, follow [conventional-changelog-standard conventions](https://github.com/bcoe/conventional-changelog-standard/blob/master/convention.md)

### Releasing

When ready to release to npm:

1.  `git checkout master`
1.  `git pull origin master`
1.  `yarn release:dryrun`
1.  `yarn release --first-release` on first release, drop the flag thereafter
1.  Engage pre-publication paranoia
1.  `git push --follow-tags origin master`
1.  `npm publish` - not yarn here as yarn doesn't seem to respect publishConfig
