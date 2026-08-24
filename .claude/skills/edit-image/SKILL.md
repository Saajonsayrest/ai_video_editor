---
name: edit-image
description: Remove an unwanted object, watermark, or blemish from a photo using local AI inpainting (IOPaint/LaMa). Use when the user asks to erase, remove, clean up, or fix something in an image.
---

# /edit-image

Free local object/watermark removal via IOPaint (Apache-2.0). Commands run in `app/`.

1. **Make a mask.** White = the area to remove/fill, black = keep everything else,
   same canvas as the source (auto-resized if not — matching aspect ratio is safest).
   Paint one in Preview/any image editor, or generate one programmatically.
2. **Erase:** `npm run edit-image -- <image> <mask>` — first run downloads the LaMa
   checkpoint (~200MB, one-time). Cached by image+mask hash — a repeat call is instant.
3. **Result** lands in `public/input/generated/` as `iopaint-<hash>.<ext>`.
