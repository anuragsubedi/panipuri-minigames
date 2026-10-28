# Blockyard — tiny voxel sandbox (toy)

> **Status:** proposed · **Rank:** 8 / 8 · **Effort:** 2–3 (three.js) / 4–6 (raw WebGL) · **Type:** toy ⚠️ needs a user decision before building
> Shared rules for every spec: [`../README.md`](../README.md). Update this header when status changes (proposed → approved → in progress → shipped).

**Pitch:** A small floating island of blocks. Walk around, dig, build and pick from a handful of block colors. No survival, no crafting: just building.

**Reality check:** This is the largest idea by far.
- **Raw WebGL from scratch (no dependencies):** shaders, a camera, chunk meshing with face culling, ray-cast block picking, pointer-lock controls and collision. Realistically **4–6 sessions**, with a high risk of rough edges.
- **With three.js (a dependency):** about **2–3 sessions**.
- Either way it's the least "minigame-like" item here.

**Minimal scope (v0.1)**
- One 32×32×16 chunk with a generated island (seeded value noise).
- First-person: WASD + mouse look (pointer lock), jump, simple AABB collision.
- Left click breaks a block; right click places one; number keys choose from 6 flat-colored block types (no textures, so no assets).
- Optional: save the world to `localStorage`.

**Tech approach (path without dependencies):**
- Single VBO per chunk, rebuilt on edit (greedy meshing is a stretch).
- Ray march with the DDA voxel traversal algorithm (Amanatides & Woo).
- Pure modules, all testable: `world/{chunk.js, noise.js, mesh.js}`, `physics/{raycast.js, collide.js}`. Then `gfx/{gl.js, shaders.js, camera.js}`.

**Acceptance:** 60 fps on a laptop; break/place feels instant; no falling through the floor; touch is out of scope (desktop only, stated on the hub tile).

**Out of scope:** multiple chunks / infinite world, mobs, crafting, multiplayer, textures.

**Recommendation:** only after the others ship, and only with an explicit user decision on raw WebGL vs. three.js.

**Sanity check**
- ✅ Estimates hold: the "mini Minecraft" core loop needs meshing, picking, collision and controls before it's fun at all. There's no cheap partial version that wows.
- ⚠️ Pointer lock requires a user click and doesn't exist on mobile, so desktop only (as stated).
- ⚠️ Rebuilding a 32×32×16 chunk mesh on each edit is fine (about 16k voxels); don't over-engineer greedy meshing in v0.1.
- ⚠️ Name, art and copy must stay original: no blocky-grass texture look-alikes or familiar block names.
- This remains last in the order; it's the only idea that likely needs a dependency to stay pleasant to build.
