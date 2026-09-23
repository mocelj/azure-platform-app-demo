## Platform request

Target (`service-engine`):

Configuration path:

Reason and intended size change:

## Checks

- [ ] This configuration-only PR changes only the selected approved JSON request.
- [ ] I ran the catalog validator at the approved revision and recorded its result.
- [ ] I did not change engine, network, identity, runtime/image, workflows, or catalog pins.
- [ ] No credentials, customer data, or live environment bindings are included.

Actual command and result:

## Handoff

Consumer validation is not deployment authorization. After merge, a maintainer uses the catalog's trusted workflow with the exact consumer SHA. Azure preview/apply and application health are **not run** unless separately recorded.

For a payload or platform-owned-file change, explain why this is not a configuration-only PR and request the separate review/release path.
