"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  PiontsClient: () => PiontsClient,
  PiontsError: () => PiontsError,
  PiontsTimeoutError: () => PiontsTimeoutError,
  PiontsWebhook: () => PiontsWebhook
});
module.exports = __toCommonJS(index_exports);

// src/errors.ts
var PiontsError = class extends Error {
  constructor(message, statusCode, response) {
    super(message);
    this.statusCode = statusCode;
    this.response = response;
    this.name = "PiontsError";
  }
};
var PiontsTimeoutError = class extends PiontsError {
  constructor(timeoutMs) {
    super(`Request timed out after ${timeoutMs}ms`, 0);
    this.name = "PiontsTimeoutError";
  }
};

// src/client.ts
var DEFAULT_TIMEOUT = 1e4;
var RETRY_DELAY = 1e3;
var PiontsClient = class {
  constructor(options) {
    let url = options.apiUrl.replace(/\/+$/, "");
    if (!url.endsWith("/api/v2")) {
      if (url.endsWith("/api/v1") || url.endsWith("/api")) {
        url = url.replace(/\/api(\/v\d+)?$/, "/api/v2");
      } else {
        url = `${url}/api/v2`;
      }
    }
    this.apiUrl = url;
    this.secretKey = options.secretKey;
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.checkout = {
      validate: (code) => this.post("/checkout/validate", { code }),
      markUsed: (code, orderId) => this.post("/checkout/mark-used", { code, orderId })
    };
    this.orders = {
      paid: (data) => this.post("/orders/paid", data),
      refunded: (orderId, amount) => this.post("/orders/refunded", { orderId, refundAmount: amount })
    };
    this.customers = {
      get: (email) => this.get(`/customers/${encodeURIComponent(email)}`),
      redeem: (email, points) => this.post(`/customers/${encodeURIComponent(email)}/redeem`, { points }),
      cancelRedemption: (email, id) => this.delete(`/customers/${encodeURIComponent(email)}/redemptions/${id}`)
    };
    this.config = {
      get: () => this.get("/config")
    };
    this.widget = {
      init: (email, name) => this.post("/widget/init", { email, name })
    };
  }
  // ==================== HTTP Methods ====================
  async get(path) {
    return this.request("GET", path);
  }
  async post(path, body) {
    return this.request("POST", path, body);
  }
  async delete(path) {
    return this.request("DELETE", path);
  }
  // ==================== Core Request ====================
  async request(method, path, body, retry = true) {
    const url = `${this.apiUrl}${path}`;
    const headers = {
      "X-Api-Key": this.secretKey
    };
    if (body !== void 0) {
      headers["Content-Type"] = "application/json";
    }
    const options = {
      method,
      headers,
      body: body !== void 0 ? JSON.stringify(body) : void 0
    };
    try {
      const response = await this.fetchWithTimeout(url, options);
      return await this.handleResponse(response);
    } catch (err) {
      if (retry && this.isRetryable(err)) {
        await this.delay(RETRY_DELAY);
        return this.request(method, path, body, false);
      }
      throw err;
    }
  }
  async fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new PiontsTimeoutError(this.timeout);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
  async handleResponse(response) {
    if (response.ok) {
      const text = await response.text();
      if (!text) return {};
      return JSON.parse(text);
    }
    let errorBody;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text().catch(() => null);
    }
    const message = errorBody?.message ?? errorBody?.error ?? `Pionts API error: ${response.status}`;
    throw new PiontsError(message, response.status, errorBody);
  }
  isRetryable(err) {
    if (err instanceof PiontsError) {
      return err.statusCode >= 500;
    }
    return !(err instanceof PiontsTimeoutError);
  }
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
};

// src/webhook.ts
var crypto = __toESM(require("crypto"));
var PiontsWebhook = class {
  /**
   * Verify a webhook signature using HMAC-SHA256.
   *
   * @param rawBody - The raw request body as string or Buffer
   * @param signature - The signature from the `X-Pionts-Signature` header (format: `sha256=<hex>`)
   * @param secret - The webhook secret for this endpoint
   * @returns true if the signature is valid
   */
  static verify(rawBody, signature, secret) {
    if (!signature || !secret) return false;
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    const provided = signature.startsWith("sha256=") ? signature.slice(7) : signature;
    if (expected.length !== provided.length) return false;
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(provided, "hex")
    );
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PiontsClient,
  PiontsError,
  PiontsTimeoutError,
  PiontsWebhook
});
//# sourceMappingURL=index.js.map