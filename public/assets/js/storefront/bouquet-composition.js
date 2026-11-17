"use strict";

// Korean-style 2D assembly. Materials remain illustrative; checkout quantities
// and prices come exclusively from the selected option DTOs.
window.RylvaBouquetComposition = (() =>
{
  const assetRoot = "/assets/images/bouquet/korean/";
  const assetUrls =
  [
    assetRoot + "rose-heads.png",
    assetRoot + "back-wrapper.png",
    assetRoot + "front-collar.png",
    assetRoot + "ribbon.png"
  ];
  const focalSlots =
  [
    [-18, -28], [48, -40], [-73, -5], [34, 30], [-29, 40], [88, 10],
    [-111, 40], [89, 74], [-72, 86], [4, 94], [-127, -26], [120, -14],
    [-3, -88], [60, -88], [-61, -79], [-135, 95], [140, 50], [58, 126],
    [-31, 134], [136, 112], [-96, 135], [91, -53], [-100, -62], [12, 6]
  ];
  const foliageSlots =
  [
    [-136, -72], [137, -57], [36, -114], [-82, -108], [163, 12],
    [-165, 19], [100, -102], [-124, 75]
  ];

  function clamp(value, minimum, maximum)
  {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function randomValue(key)
  {
    let hash = 2166136261;
    for (const character of key)
    {
      hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    }
    hash ^= hash >>> 16;
    hash = Math.imul(hash, 0x7feb352d);
    hash ^= hash >>> 15;
    hash = Math.imul(hash, 0x846ca68b);
    hash ^= hash >>> 16;
    return (hash >>> 0) / 4294967295;
  }

  function fanRotation(x, key)
  {
    const distance = (x - 210) / 150;
    const variation = randomValue(key + "-tilt") * 8;
    if (x < 190)
    {
      return -Math.round(clamp(5 + Math.abs(distance) * 15 + variation, 5, 25));
    }
    if (x > 230)
    {
      return Math.round(clamp(5 + Math.abs(distance) * 15 + variation, 5, 25));
    }
    return Math.round((randomValue(key + "-tilt") - 0.5) * 18);
  }

  function createFlowers(options, selections)
  {
    const flowers = [];
    for (const option of options.filter((candidate) => candidate.groupId === "flowers"))
    {
      const copies = Math.min((selections[option.id] || 0) * 5, 12);
      for (let index = 0; index < copies; index++)
      {
        const key = option.id + "-" + index;
        flowers.push({ option, key, order: randomValue(key + "-order") });
      }
    }
    flowers.sort((left, right) => left.order - right.order);
    const verticalSpread = flowers.length > 12 ? 0.78 : flowers.length > 6 ? 0.9 : 1;
    return flowers.slice(0, focalSlots.length).map((item, index) =>
    {
      const slot = focalSlots[index];
      const x = 210 + slot[0] + (randomValue(item.key + "-x") - 0.5) * 10;
      const y = 166 + slot[1] * verticalSpread + (randomValue(item.key + "-y") - 0.5) * 12;
      const depth = clamp((y - 95) / 175, 0, 1);
      const scale = clamp(0.85 + randomValue(item.key + "-scale") * 0.12 + depth * 0.18, 0.85, 1.15);
      return {
        ...item,
        x: Math.round(x),
        y: Math.round(y),
        size: Math.round(78 + randomValue(item.key + "-size") * 10),
        scale: Number(scale.toFixed(3)),
        rotation: fanRotation(x, item.key),
        brightness: Number((0.92 + depth * 0.10).toFixed(3)),
        variant: Math.floor(randomValue(item.key + "-view") * 3),
        layer: Math.round(y)
      };
    }).sort((left, right) => left.y - right.y);
  }

  function backFoliage(option, quantity)
  {
    const count = Math.min(quantity * 3, foliageSlots.length);
    return Array.from({ length: count }, (_, index) =>
    {
      const key = option.id + "-back-" + index;
      const slot = foliageSlots[index];
      const x = 210 + slot[0] + (randomValue(key + "-x") - 0.5) * 10;
      const y = 163 + slot[1] + (randomValue(key + "-y") - 0.5) * 10;
      return {
        option, key,
        x: Math.round(x),
        y: Math.round(y),
        size: Math.round(94 + randomValue(key + "-size") * 18),
        scale: Number((0.85 + randomValue(key + "-scale") * 0.2).toFixed(3)),
        rotation: fanRotation(x, key),
        brightness: 0.92,
        layer: Math.round(y)
      };
    });
  }

  function gapCandidates(blooms)
  {
    const candidates = [];
    for (let index = 0; index < blooms.length; index++)
    {
      const current = blooms[index];
      const neighbor = blooms.filter((candidate) => candidate !== current)
        .sort((left, right) => Math.hypot(left.x - current.x, left.y - current.y)
          - Math.hypot(right.x - current.x, right.y - current.y))[0];
      if (!neighbor)
      {
        continue;
      }
      const x = (current.x + neighbor.x) / 2;
      const y = (current.y + neighbor.y) / 2;
      if (candidates.every((point) => Math.hypot(point.x - x, point.y - y) > 30))
      {
        candidates.push({ x, y });
      }
    }
    return candidates;
  }

  function createFillers(option, quantity, blooms)
  {
    const candidates = gapCandidates(blooms);
    const count = Math.min(quantity * 4, 9);
    return Array.from({ length: count }, (_, index) =>
    {
      const key = option.id + "-filler-" + index;
      const fallback = focalSlots[(index * 3 + 2) % focalSlots.length];
      const gap = candidates[index % Math.max(1, candidates.length)]
        || { x: 210 + fallback[0] * 0.9, y: 166 + fallback[1] * 0.8 };
      const x = gap.x + (randomValue(key + "-x") - 0.5) * 12;
      const y = gap.y + (randomValue(key + "-y") - 0.5) * 12;
      return {
        option, key,
        x: Math.round(x),
        y: Math.round(y),
        size: Math.round(53 + randomValue(key + "-size") * 12),
        scale: Number((0.85 + randomValue(key + "-scale") * 0.3).toFixed(3)),
        rotation: fanRotation(x, key),
        brightness: 1,
        layer: Math.round(y)
      };
    });
  }

  function createLayout(options, selections)
  {
    const blooms = createFlowers(options, selections);
    const leaf = options.find((option) => option.id === "eucalyptus");
    const filler = options.find((option) => option.id === "baby-breath");
    const greenery = leaf ? backFoliage(leaf, selections[leaf.id] || 0) : [];
    const fillers = filler ? createFillers(filler, selections[filler.id] || 0, blooms) : [];
    const frontGreenery = leaf && selections[leaf.id]
      ? [-1, 1].map((direction, index) =>
      {
        const key = leaf.id + "-front-" + index;
        const x = 210 + direction * 112;
        const y = 222 + (index === 0 ? 10 : -9);
        return {
          option: leaf, key, x, y, size: 67, scale: 0.9,
          rotation: direction * 23, brightness: 1, layer: y
        };
      })
      : [];
    const lowerEdge = blooms.length
      ? Math.max(...blooms.map((item) => item.y + item.size * item.scale / 2))
      : 280;
    const collarTop = Math.round(clamp(lowerEdge - 82, 186, 238));
    const tieY = collarTop + 196;
    const backTop = 35;
    const backTieFraction = 0.76;
    const backHeight = Math.round((tieY - backTop) / backTieFraction);
    return {
      blooms, greenery, fillers, frontGreenery, collarTop, tieY, backTop, backHeight,
      wrapperWidth: Math.round(clamp(318 + Math.sqrt(blooms.length) * 8, 318, 370)),
      ribbonTop: tieY - 30,
      fit: collarTop > 216 ? 0.93 : 1
    };
  }

  function placement(item)
  {
    return "--bloom-x: " + item.x + "px; --bloom-y: " + item.y + "px; "
      + "--bloom-size: " + item.size + "px; --bloom-scale: " + item.scale + "; "
      + "--bloom-angle: " + item.rotation + "deg; --bloom-layer: " + item.layer + "; "
      + "--bloom-brightness: " + item.brightness;
  }

  function botanical(item, className, sprite, crop = false)
  {
    return `
      <span class="${className}" style="${placement(item)}" data-botanical="${item.key}">
        <span class="${crop ? "bq-filler-crop" : "bq-leaf-art"}">
          ${sprite(item.option)}
        </span>
      </span>`;
  }

  function render(options, selections, sprite)
  {
    const layout = createLayout(options, selections);
    const wrapped = Boolean(selections["sage-wrap"]);
    const focal = layout.blooms.map((item) => `
      <span class="bq-stem" data-bloom="${item.key}" style="${placement(item)}">
        <span class="bq-bloom-art bq-bloom-${item.option.visual}-${item.variant}"></span>
      </span>`).join("");
    return `
      <div class="bq-composition ${wrapped ? "is-wrapped" : ""}" data-renderer="korean-bouquet"
        style="
          --wrapper-width: ${layout.wrapperWidth}px;
          --collar-top: ${layout.collarTop}px;
          --back-top: ${layout.backTop}px;
          --back-height: ${layout.backHeight}px;
          --ribbon-top: ${layout.ribbonTop}px;
          --composition-fit: ${layout.fit}">
        <div class="bq-composition-layer bq-layer-back-wrapper" data-composition-layer="back-wrapper">
          ${wrapped ? '<img class="bq-paper-back" src="' + assetRoot + 'back-wrapper.png" width="360" height="400" alt="">' : ""}
        </div>
        <div class="bq-composition-layer bq-layer-back-foliage" data-composition-layer="back-foliage">
          ${layout.greenery.map((item) => botanical(item, "bq-greenery", sprite)).join("")}
        </div>
        <div class="bq-composition-layer bq-layer-focal bq-floral-crown" data-composition-layer="focal-flowers">
          ${focal}
        </div>
        <div class="bq-composition-layer bq-layer-front-filler" data-composition-layer="front-filler">
          ${layout.fillers.map((item) => botanical(item, "bq-filler", sprite, true)).join("")}
          ${layout.frontGreenery.map((item) => botanical(item, "bq-front-greenery", sprite)).join("")}
        </div>
        <div class="bq-composition-layer bq-layer-front-collar" data-composition-layer="front-collar">
          ${wrapped ? '<img class="bq-paper-front" src="' + assetRoot + 'front-collar.png" width="350" height="220" alt="">' : ""}
        </div>
        <div class="bq-composition-layer bq-layer-ribbon" data-composition-layer="ribbon">
          ${selections["cream-ribbon"] ? '<img class="bq-composition-ribbon" src="' + assetRoot + 'ribbon.png" width="112" height="110" alt="">' : ""}
        </div>
      </div>`;
  }

  return { createLayout, render, assetUrls };
})();
