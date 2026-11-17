"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { randomUUID } = require("node:crypto");
const source = fs.readFileSync("public/assets/js/storefront/wishlist-store.js", "utf8").split("\n(() =>")[0];
const context = { window: {}, crypto: { randomUUID }, structuredClone, setTimeout };
vm.runInNewContext(source, context);
const createStore = context.window.RylvaWishlistStoreFactory;

function storageWith(items = [])
{
  const values = new Map([["test", JSON.stringify({ version: 1, items })]]);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
}

function deferred()
{
  let resolve;
  const promise = new Promise((complete) => resolve = complete);
  return { promise, resolve };
}

async function run()
{
  const checks = [];
  const guestStorage = storageWith();
  const guest = createStore({ storage: guestStorage, guestKey: "test" });
  await guest.ready;
  await guest.setSaved("9007199254740993", true);
  await guest.setSaved("9007199254740993", true);
  const reloaded = createStore({ storage: guestStorage, guestKey: "test" });
  await reloaded.ready;
  assert.equal(reloaded.snapshot().items.length, 1);
  assert.equal(reloaded.snapshot().items[0].productId, "9007199254740993");
  checks.push("Guest persistence and duplicate desired-state calls preserve BIGINT identity");

  const mergeStorage = storageWith([{ productId: "A", savedAt: 1 }, { productId: "B", savedAt: 2 }]);
  const mergeResponse = deferred();
  const merging = createStore(
  {
    guestKey: "test",
    storage: mergeStorage,
    adapter:
    {
      getSession: async () => ({ mode: "account", owner: "account-A" }),
      load: async () => ({ revision: 0, items: [] }),
      mergeGuest: () => mergeResponse.promise
    }
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  mergeStorage.setItem("test", JSON.stringify({ version: 1, items:
    [{ productId: "A", savedAt: 10 }, { productId: "B", savedAt: 2 }, { productId: "C", savedAt: 3 }] }));
  mergeResponse.resolve({ outcome: "confirmed", revision: 1, items: [{ productId: "A", savedAt: 4 }], accepted: ["A"] });
  await merging.ready;
  const remaining = JSON.parse(mergeStorage.getItem("test")).items;
  assert.deepEqual(remaining.map((item) => item.productId), ["A", "B", "C"]);
  assert.equal(merging.snapshot().merge.status, "partial");
  checks.push("Partial merge preserves newer replacements and additions made after the source snapshot");

  let committed = [];
  const uncertain = createStore(
  {
    storage: storageWith(),
    guestKey: "test",
    adapter:
    {
      getSession: async () => ({ mode: "account", owner: "account-A" }),
      load: async () => ({ revision: 0, items: [] }),
      async setSaved(operation)
      {
        committed = [{ productId: operation.productId, savedAt: 1 }];
        throw Object.assign(new Error("Lost response"), { code: "uncertain" });
      },
      reconcile: async () => ({ outcome: "confirmed", revision: 1, items: committed })
    }
  });
  await uncertain.ready;
  await assert.rejects(uncertain.setSaved("A", true), (error) => error.code === "uncertain");
  assert.equal(uncertain.has("A"), false);
  await assert.rejects(uncertain.setSaved("A", true), (error) => error.code === "pending");
  await uncertain.reconcile("A");
  assert.equal(uncertain.has("A"), true);
  assert.equal(uncertain.snapshot().uncertain.length, 0);
  checks.push("Unknown write outcomes block repeated mutation until reconciliation");

  let owner = "account-A";
  const lateResponse = deferred();
  const privateStore = createStore(
  {
    storage: storageWith(), guestKey: "test",
    adapter:
    {
      getSession: async () => ({ mode: "account", owner }),
      load: async () => ({ revision: 0, items: [] }),
      setSaved: () => lateResponse.promise
    }
  });
  await privateStore.ready;
  const writing = privateStore.setSaved("A-private", true);
  const rejectedWrite = assert.rejects(writing, (error) => error.code === "session");
  owner = "account-B";
  await privateStore.refresh();
  lateResponse.resolve({ revision: 1, items: [{ productId: "A-private", savedAt: 1 }] });
  await rejectedWrite;
  assert.equal(privateStore.snapshot().owner, "account-B");
  assert.equal(privateStore.snapshot().items.length, 0);
  checks.push("A late response from owner A cannot repopulate owner B's list");

  const firstResponse = deferred();
  const secondResponse = deferred();
  const concurrent = createStore(
  {
    storage: storageWith(), guestKey: "test",
    adapter:
    {
      getSession: async () => ({ mode: "account", owner: "account-A" }),
      load: async () => ({ revision: 0, items: [] }),
      setSaved: (operation) => operation.productId === "A" ? firstResponse.promise : secondResponse.promise
    }
  });
  await concurrent.ready;
  const firstWrite = concurrent.setSaved("A", true);
  const secondWrite = concurrent.setSaved("B", true);
  secondResponse.resolve({ revision: 2, items: [{ productId: "A", savedAt: 1 }, { productId: "B", savedAt: 2 }] });
  await secondWrite;
  firstResponse.resolve({ revision: 1, items: [{ productId: "A", savedAt: 1 }] });
  await firstWrite;
  assert.equal(concurrent.snapshot().items.length, 2);
  checks.push("Out-of-order responses cannot replace a newer account revision");

  const invalid = createStore(
  {
    storage: storageWith(), guestKey: "test",
    adapter:
    {
      getSession: async () => ({ mode: "account", owner: "account-A" }),
      load: async () => ({ revision: 0, items: [{ productId: 9007199254740993, savedAt: 1 }] })
    }
  });
  await invalid.ready;
  assert.equal(invalid.snapshot().status, "error");
  assert.equal(invalid.snapshot().error.code, "invalidData");
  checks.push("An invalid account payload is rejected instead of presented as a valid empty collection");

  checks.forEach((check) => console.log("PASS " + check));
}

run().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
