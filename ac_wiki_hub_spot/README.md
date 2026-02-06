# Docs Mind Map (Canonical)

This is a **static** GitHub Pages site that shows:

- Left: collapsible tree (expand/collapse, search, copy link)
- Right: Mermaid diagram (click nodes to open docs)

## Publish on GitHub Pages

1. Create a new GitHub repo.
2. Commit all files in this folder.
3. In GitHub: **Settings → Pages**
   - Source: `Deploy from a branch`
   - Branch: `main` / `(root)`
4. Open the Pages URL.

## Update content

Edit: `assets/docs-tree.json`

This file is the **single source of truth**.

The Mermaid diagram is generated automatically from the JSON at runtime.

## Notes

- This build is **single-language canonical** (query params like `?hsLang=en` were removed).
- URLs were derived from your extracted link list (Link Gopher).


## AS-IS / No-hallucination mode
This build was generated strictly from the extracted published `/docs` URLs (Link Gopher export). Node titles are derived deterministically from URL path segments; `brief` fields are intentionally empty because no page content was fetched.
