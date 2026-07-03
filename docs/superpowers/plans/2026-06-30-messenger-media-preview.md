# Messenger Media Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Messenger-style image and video previews before sending, inline media messages, and an accessible full-screen lightbox while retaining generic file cards.

**Architecture:** Pure attachment classification and markup helpers keep media decisions testable. `CollaborationController` owns the single composer object URL and shared lightbox lifecycle, while the existing Supabase attachment schema and upload flow remain unchanged.

**Tech Stack:** Vanilla JavaScript ES modules, HTML, CSS, Node test runner, Supabase Storage.

---

### Task 1: Media classification and validation

**Files:**
- Modify: `collaboration.js`
- Modify: `tests/collaboration.test.js`

- [ ] **Step 1: Write failing tests for video uploads and attachment classification**

Add imports for `attachmentKind`, then assert image MIME detection, video MIME detection, extension fallback, generic-file fallback, and acceptance of MP4/WebM/MOV through `validateUpload`.

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `node --test --test-name-pattern="uploads|attachment kind" tests/collaboration.test.js`

Expected: FAIL because video extensions and `attachmentKind` are not implemented.

- [ ] **Step 3: Implement the minimal pure helper and extension allowlist**

Export `attachmentKind(attachment)` returning `image`, `video`, or `file`. Prefer MIME prefixes and fall back to the supported filename extensions. Add `mp4`, `webm`, and `mov` to `ALLOWED_FILE`.

- [ ] **Step 4: Run focused tests**

Run: `node --test --test-name-pattern="uploads|attachment kind" tests/collaboration.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add collaboration.js tests/collaboration.test.js
git commit -m "feat: classify chat media attachments"
```

### Task 2: Inline media markup

**Files:**
- Modify: `collaboration-controller.js`
- Modify: `tests/collaboration.test.js`

- [ ] **Step 1: Write failing markup tests**

Create controller messages with image, video, and PDF attachments. Assert image markup has `chat-media-trigger` and a lazy image, video markup has `chat-video-preview`, `preload="metadata"`, and native controls, while PDF markup retains `chat-attachment`. Assert malicious names and URLs cannot break attributes.

- [ ] **Step 2: Run focused markup tests and verify failure**

Run: `node --test --test-name-pattern="attachment markup|media markup" tests/collaboration.test.js`

Expected: FAIL because all attachments currently render as download cards.

- [ ] **Step 3: Add isolated attachment markup helpers**

Import `attachmentKind`. Add `attachmentMarkup(attachment)` plus a generic fallback link. Render responsive image/video media and keep safe filename/download fallback markup available on load failure.

- [ ] **Step 4: Run focused and complete JavaScript tests**

Run: `node --test tests/collaboration.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add collaboration-controller.js tests/collaboration.test.js
git commit -m "feat: render image and video chat messages"
```

### Task 3: Composer preview lifecycle

**Files:**
- Modify: `index.html`
- Modify: `collaboration-controller.js`
- Modify: `tests/collaboration.test.js`
- Modify: `tests/frontend-contract.sh`

- [ ] **Step 1: Write failing lifecycle and DOM contract tests**

Assert the page contains `chat-file-preview`, `chat-file-preview-remove`, and video extensions in the file input. Test controller cleanup with stubbed `URL.revokeObjectURL`, and assert source paths call cleanup after replacement and successful send.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test`

Expected: FAIL because the preview shell and lifecycle methods do not exist.

- [ ] **Step 3: Implement preview ownership**

Add the preview shell above the composer controls. Add `selectedFilePreviewUrl`, `clearSelectedFile()`, and media-aware `renderSelectedFile(file)`. Use `URL.createObjectURL` for valid media, revoke the previous URL before replacement, keep selection on send failure, and clear it after success or remove-button activation.

- [ ] **Step 4: Run all tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html collaboration-controller.js tests/collaboration.test.js tests/frontend-contract.sh
git commit -m "feat: preview selected chat media"
```

### Task 4: Accessible media lightbox

**Files:**
- Modify: `index.html`
- Modify: `collaboration-controller.js`
- Modify: `tests/collaboration.test.js`
- Modify: `tests/frontend-contract.sh`

- [ ] **Step 1: Write failing lightbox contract and behavior tests**

Assert dialog, close control, and content container IDs exist. Test that controller source delegates media clicks, handles Escape/backdrop/close actions, restores focus, pauses video, and clears lightbox content.

- [ ] **Step 2: Run all tests and verify failure**

Run: `npm test`

Expected: FAIL because the dialog and controller lifecycle do not exist.

- [ ] **Step 3: Implement the shared lightbox**

Add one `role="dialog"` overlay. Add controller methods `openMediaLightbox(trigger)` and `closeMediaLightbox()` using `document.createElement`, property assignment for URLs, focus restoration, and video cleanup. Wire delegated click, backdrop, close-button, and Escape handlers.

- [ ] **Step 4: Run all tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html collaboration-controller.js tests/collaboration.test.js tests/frontend-contract.sh
git commit -m "feat: add chat media lightbox"
```

### Task 5: Messenger-style presentation and responsive behavior

**Files:**
- Modify: `index.css`
- Modify: `tests/frontend-contract.sh`

- [ ] **Step 1: Add failing CSS contracts**

Assert styles exist for `.chat-file-preview`, `.chat-media-trigger`, `.chat-media-image`, `.chat-video-preview`, `.chat-media-lightbox`, and the mobile breakpoint.

- [ ] **Step 2: Run the contract test and verify failure**

Run: `bash tests/frontend-contract.sh`

Expected: FAIL because media styles are absent.

- [ ] **Step 3: Implement visual styles**

Add compact pre-send thumbnails, media-first bubble treatment, responsive dimensions, rounded group corners, dark overlay layout, visible focus rings, close control, and reduced-motion behavior. Keep generic file styles unchanged.

- [ ] **Step 4: Run the complete suite**

Run: `npm test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.css tests/frontend-contract.sh
git commit -m "style: match Messenger media previews"
```

### Task 6: End-to-end verification

**Files:**
- Modify only if verification reveals a defect in the files above.

- [ ] **Step 1: Run static and automated verification**

Run: `npm test && git diff --check`

Expected: all tests pass and no whitespace errors are reported.

- [ ] **Step 2: Start the app and verify in a browser**

Run the repository's local server, then verify desktop and narrow viewports: select/remove image and video, send media, open/close image and video lightboxes, use video controls, close with Escape/backdrop, and confirm no console errors.

- [ ] **Step 3: Review repository state**

Run: `git status --short && git log -6 --oneline`

Expected: only the user's pre-existing untracked `code.md` remains; implementation commits are present.
