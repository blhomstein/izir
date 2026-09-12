# ADR 0001: Organization identity and names

- Status: Accepted
- Date: 2026-09-12
- Ticket: KAN-11

## Context

An Organization needs a stable identity before employment sources can refer to it. Names, URLs, domains, and provider identifiers can change, and distinct organizations can share a name.

## Decision

- A UUID is the Organization's sole identity.
- The Organization stores one required, human-readable `name`.
- Names are trimmed and length-limited but are not unique.
- A separate normalized name is deferred until a concrete lookup or identity-resolution use case exists.
- Creating an existing UUID fails with `OrganizationAlreadyExistsError`.
- Creating a new UUID with an existing name is allowed.
- New organizations are active. They may later be archived, but KAN-11 does not add update or deletion operations.

## Consequences

Retries have deterministic behavior when they reuse an ID. Organization identity does not depend on mutable provider data. Later identity resolution may introduce aliases or merge workflows without changing existing IDs. Callers cannot assume that equal names identify the same organization.
