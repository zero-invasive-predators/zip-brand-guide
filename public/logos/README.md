# Logo files

Drop PNG logos into each brand folder. Filenames are usually prefixed with the brand id.

List each asset in `data/brands.json` as an array entry:

```json
{
  "name": "Tohu • Any background",
  "file": "logos/pfsw/pfsw-tohu.png",
  "background": "any"
}
```

- `name` — label under the preview
- `file` — path relative to `public/`
- `background` — preview chrome: `light`, `dark`, or `any` (checkerboard)

Example folder layout:

```
public/logos/zip/
  zip-logo-light.png
  zip-logo-dark.png
  zip-brandmark-light.png
```

Brand ids: `zip`, `pfsw`, `tmap`, `pfr`.
