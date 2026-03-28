Release Guide for this Project

Overview:
- This guide describes how to prepare, verify, and publish a new release version.

Prerequisites:
- Node.js environment, access to npm (or your package registry), and git.
- Ensure the repository is on the correct branch (e.g., main or master).

Steps:
1) Bump version
- Update the version in package.json (semver: MAJOR.MINOR.PATCH).
- Update CHANGELOG.md under the Unreleased section with a concise summary.

2) Regenerate API docs (Swagger) if API surface changed
- Ensure tsoa.json is configured as desired.
- Run: npx tsoa spec
- Run: npx tsoa routes

3) Run tests and build
- npm test (or your project test command)
- npm run build (if applicable)

4) Commit changes
- git add -A
- git commit -m "chore(release): vX.Y.Z"

5) Tag and push
- git tag -a vX.Y.Z -m "Release vX.Y.Z"
- git push origin main --tags

6) Publish
- npm publish --access public (if publishing a package)
- Update any release notes on GitHub if you use GitHub Releases.

7) Post-release
- Announce release and update any docs or changelog references.

Notes:
- Do not publish without updating the changelog and tag to reflect the release.
- If this project has a separate CI/CD pipeline, ensure it runs for the new release.
