# OACP - Of A Certain Pattern
## A framework of sorts

[![Greenkeeper badge](https://badges.greenkeeper.io/doesdev/oacp.svg)](https://greenkeeper.io/)

### It's SCRUD all the way down, and some Postgres too

This library was built to fit a **very specific pattern.**

Opinionated is an understatement. This is a super strict
implementation of a particular pattern. Use this and
stray from it to your own peril.

#### The gist of it is this:
- use it to create [SCRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) driven APIs / Micro-APIs
- data storage and access is PG function driven
- all PG functions accept and return JSONB
- all PG function follow the naming convention below
  * namespace_model_action
- JWT authorization
- strict JWT format drives access control

### Documentation is non-existent
It is my intent to add docs, but due to the nature of
the project it is assumed no one else is using this.
If you've read the description or looked at the source
and are interested in docs open an issue and I'll
prioritize it.
