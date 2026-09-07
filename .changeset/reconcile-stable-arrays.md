---
'@bazza-ui/react': patch
---

The popup-menu Menu Tree resolver now returns the existing node array from `setContent`/`graft` when re-supplied defs produce no change, so `rootNodes` and `parent.children` keep their identity across unchanged re-renders.
