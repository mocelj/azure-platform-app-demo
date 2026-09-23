## Configuration change

Target (`service-engine`):

Configuration path:

Reason and expected effect:

## Checks

- [ ] The change is limited to the selected JSON request.
- [ ] Validation used the catalog revision in the version metadata; results are below.
- [ ] Engine, network, identity, runtime/image, workflows, and catalog pins are unchanged.
- [ ] No credentials, customer data, or live environment bindings are included.

Commands and results:

## Handoff

After merge, a platform maintainer can plan and apply the change through the
catalog workflow using the consumer commit SHA. Note any deployment or
application checks still needed.

If this PR changes application code or platform-owned files instead, describe
the separate review and release required.
