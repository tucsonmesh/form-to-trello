# Tucson Mesh Interest Form Submission Handler

This repository contains a Google [Apps Script](https://script.google.com) that can be registered to run whenever submission events happen on an associated Google Form.

Tucson Mesh uses this script to create Trello cards that can be used to keep up with who is requesting a connection to our network.
These cards can then be tracked throughout their lifecycle from requested to surveyed to installed.

When paired with [trello-to-geojson](https://github.com/tucsonmesh/trello-to-geojson) and [map-js](https://github.com/tucsonmesh/map-js), we are able to build a map that allows us to visualize and plan out where the network can or should be expanded.
