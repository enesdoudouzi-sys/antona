/* Persistence and portable backup helpers shared by the browser app and tests. */
(function (root) {
  "use strict";

  var MAX_BACKUP_CHARS = 2 * 1024 * 1024;
  var MAX_PROFILES = 50;
  var FORMAT = "lernstern-backup";
  var VERSION = 1;

  function getStorage(storage) {
    if (storage) return storage;
    try { return root.localStorage; } catch (error) { return null; }
  }

  function load(key, fallback, storage) {
    try {
      var source = getStorage(storage);
      if (!source) return fallback;
      var value = source.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function save(key, value, storage) {
    try {
      var source = getStorage(storage);
      if (!source) return false;
      source.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function isRecord(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    var proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
  }

  function validProfiles(profiles) {
    if (!Array.isArray(profiles) || profiles.length > MAX_PROFILES) return false;
    var ids = new Set();
    return profiles.every(function (profile) {
      var validId = isRecord(profile) && (typeof profile.id === "string" || (typeof profile.id === "number" && Number.isFinite(profile.id)));
      if (!validId || ids.has(String(profile.id))) return false;
      ids.add(String(profile.id));
      return typeof profile.name === "string" && profile.name.trim().length > 0 && profile.name.length <= 14 &&
        (profile.av === undefined || (typeof profile.av === "string" && profile.av.length <= 12 && !/[<>]/.test(profile.av))) && isRecord(profile.stats) &&
        (profile.stats.best === undefined || isRecord(profile.stats.best)) &&
        (profile.stats.history === undefined || isRecord(profile.stats.history)) &&
        (profile.stats.unlocked === undefined || Array.isArray(profile.stats.unlocked));
    });
  }

  function toBase64(text) {
    if (typeof root.btoa === "function") return root.btoa(unescape(encodeURIComponent(text)));
    return Buffer.from(text, "utf8").toString("base64");
  }

  function fromBase64(value) {
    if (typeof root.atob === "function") return decodeURIComponent(escape(root.atob(value)));
    return Buffer.from(value, "base64").toString("utf8");
  }

  function encodeBackup(profiles) {
    if (!validProfiles(profiles)) throw new Error("Ungültige Profile.");
    var payload = JSON.stringify({ format: FORMAT, version: VERSION, profiles: profiles });
    var encoded = toBase64(payload);
    if (encoded.length > MAX_BACKUP_CHARS) throw new Error("Sicherung ist zu groß.");
    return encoded;
  }

  function decodeBackup(code) {
    if (typeof code !== "string" || !code.trim() || code.length > MAX_BACKUP_CHARS) throw new Error("Ungültiger Sicherungscode.");
    var parsed = JSON.parse(fromBase64(code.trim()));
    // Continue to accept backups created by earlier Lernsterne versions.
    var profiles = Array.isArray(parsed) ? parsed :
      (isRecord(parsed) && parsed.format === FORMAT && parsed.version === VERSION ? parsed.profiles : null);
    if (!validProfiles(profiles)) throw new Error("Der Sicherungscode enthält keine gültigen Profile.");
    return profiles;
  }

  var api = { load: load, save: save, encodeBackup: encodeBackup, decodeBackup: decodeBackup, validProfiles: validProfiles };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.LernsterneStorage = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
