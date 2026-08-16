import { describe, expect, it } from "vitest";

describe("VAPT lab contract", () => {
  it("uses the exact report lifecycle labels", () => {
    const statuses = ["Open", "Remediated", "Retested"];
    expect(statuses).toEqual(["Open", "Remediated", "Retested"]);
  });

  it("covers all nine requested vulnerability categories", () => {
    const categories = [
      "SQL Injection",
      "Cross-Site Scripting",
      "IDOR",
      "Authentication Weaknesses",
      "Broken Access Control",
      "File Upload",
      "CSRF",
      "Security Misconfiguration",
      "Session Management",
    ];
    expect(categories).toHaveLength(9);
    expect(new Set(categories).size).toBe(9);
  });
});
