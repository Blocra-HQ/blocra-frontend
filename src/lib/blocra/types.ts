// The signed report envelope served by GET /api/reports/traction?signed=true
// and written by `blocra report` as <name>.json.
export interface Attestation {
  algorithm: string;
  signer: string;
  /** Hex Ed25519 signature over the UTF-8 bytes of report_json. */
  signature: string;
  payload_sha256: string;
  method_version: string;
  signed_at: string;
}

export interface SignedEnvelope {
  /** The exact compact JSON of the report that was signed. */
  report_json: string;
  attestation: Attestation;
}
