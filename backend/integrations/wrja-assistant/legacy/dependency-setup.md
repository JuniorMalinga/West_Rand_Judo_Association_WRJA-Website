# Node dependency setup and installation recovery

Read before the first install for a new Node toolchain or changed dependencies, and for blocked scripts or missing generated outputs.

## Before installation

When the chosen project uses Node, pin the package manager in `packageManager`. Before the
first installation, put lifecycle-script permissions in checked-in project configuration.
For pnpm 11+, use `pnpm-workspace.yaml` and reviewed `allowBuilds` decisions (`true` for required
scripts, `false` for intentionally blocked scripts). The removed `onlyBuiltDependencies` and
`ignoredBuiltDependencies` settings do not substitute for that policy on pnpm 11. For a project
pinned to pnpm 10, keep its reviewed lists in `pnpm-workspace.yaml`, not `package.json`; do not
assume an older pin supports `allowBuilds`. Preserve a compatible existing policy.

Never use `--ignore-scripts` or an interactive approval command such as bare
`pnpm approve-builds`. Do not leave a foreground command waiting for stdin. With pnpm 10.1+,
check `pnpm ignored-builds` after installing.

## Recover an installation

If a required script is blocked, correct its
version-appropriate policy and rebuild it. `Cannot identify` is inconclusive: check that the
installed tree exists, the required permissions are explicit, and the actual consuming tool
works. A transitive package need not be directly resolvable from the project root; test its
consumer instead of adding an unused direct dependency to make a probe work.

Continue only after installation succeeds and required script outputs work. Do not change
working dependency declarations or repeatedly install just to obtain the word `None`. Never
manufacture package-manager output with `echo`, `printf`, or hand-written text.
