# Messenger-style Media Preview Design

## Goal

Make image and video attachments feel native to the chat instead of appearing as generic downloadable files. Users can verify media before sending, see it inline after sending, and open it in a focused lightbox.

## Scope

- One attachment per message, matching the existing data model.
- Maximum attachment size remains 25 MB.
- Supported images: PNG, JPEG, GIF, and WebP.
- Supported videos: MP4, WebM, and MOV.
- PDF, Office, and ZIP attachments keep the existing download-card presentation.
- No gallery, multiple-file messages, server-side thumbnail generation, transcoding, or autoplay.

## User Experience

### Before sending

Selecting an image or video shows a compact thumbnail above the composer. The preview includes an accessible remove button. Selecting another file replaces the preview. Removing the file, sending successfully, or leaving the selection state releases its temporary object URL.

Validation errors remain visible near the composer. Invalid files are cleared and never previewed.

### In the conversation

Images and videos render as the primary content of the message bubble, with Messenger-like rounded corners and no filename card. Text, when present, sits immediately beside the media as part of the same visual message group.

Images use a constrained responsive frame and `object-fit: cover`. Videos display a native video surface with metadata preload and controls; they never autoplay. Media remains keyboard accessible and exposes a descriptive label derived from its safe filename.

Non-media files continue to show filename, size, and a download link.

### Lightbox

Activating inline media opens a shared, full-viewport, dark lightbox. Images display at their largest contained size. Videos use native playback controls, including seek, volume, and fullscreen support.

The lightbox closes from its close button, the Escape key, or a click on the backdrop. Opening moves focus to the close control; closing restores focus to the media trigger. Closing also pauses video and clears the lightbox content.

## Architecture

The existing attachment schema and Supabase Storage upload flow remain unchanged. Media classification is a small pure helper based primarily on `mime_type`, with a filename-extension fallback for browsers or historic rows that lack a useful MIME type.

Attachment markup has three branches:

1. Image media button with a lazy-loaded image.
2. Video media button/surface with metadata preload.
3. Existing generic file download card.

The composer owns one temporary `URL.createObjectURL()` at a time. A dedicated cleanup method revokes it before replacement and after successful send/removal.

One reusable lightbox is declared in the page shell. Delegated chat-list click handling opens it from safe attachment data attributes. The controller writes DOM properties for media URLs rather than interpolating untrusted HTML into the lightbox.

## Failure Handling

- Unsupported formats and files outside the size limit use the current validation error area.
- Inline media that fails to load reveals a generic attachment fallback with filename and download link.
- A failed send keeps the selected file and local preview so the user can retry.
- A successful send clears the file input, preview, error state, and temporary URL.
- Lightbox video is paused and removed whenever the overlay closes.

## Security and Accessibility

- Attachment URLs and filenames are escaped in generated message markup.
- Lightbox media is created with DOM APIs and assigned through element properties.
- Media triggers are keyboard operable and have explicit accessible labels.
- The lightbox uses dialog semantics, `aria-modal`, a labelled close button, Escape handling, focus entry, and focus restoration.
- Video never autoplays; motion and bandwidth remain user-controlled.

## Testing

- Unit tests cover video validation and MIME/extension classification.
- Markup tests cover image, video, generic-file, escaping, and fallback output.
- Contract tests assert the composer preview and lightbox shell exist.
- Controller tests or source contracts cover object URL cleanup and lightbox lifecycle.
- The complete existing test suite must pass.
- Browser verification covers desktop and narrow layouts, pre-send preview/removal, inline image/video, lightbox open/close, native video controls, fallback behavior, and console errors.

## Completion Criteria

The feature is complete when a user can select, preview, remove, send, view, and enlarge a supported image or video without disrupting realtime chat behavior, while generic documents retain their current download experience and all automated/browser checks pass.
