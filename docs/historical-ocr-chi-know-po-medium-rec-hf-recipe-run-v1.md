# PP-OCRv6 medium bounded HF recipe run

## Result

The pinned `t4-small` Hugging Face disposable submission was attempted with the inline runner, Python 3.11, a two-hour timeout, and the train-only `inner-train` / `inner-dev` recipe. The HF Jobs API rejected the request before creating a job:

- HTTP: `402 Payment Required`
- authenticated account: `@softieproject`
- account evidence: `hf_whoami` reported no Pro account
- follow-up `hf_jobs('ps')`: no running job

Therefore no remote process reached model or corpus download, no checkpoint was produced, and no CER/exact/document/reproducibility/weight-digest measurement exists. Those gates remain `UNKNOWN_OR_BLOCKED`; they are not treated as passes.

The terminal decision is `RECIPE_NOT_PROVEN` with `baseRetainedExplicitly: true`. `nextFineTuningGate` remains `NOT_OPEN`; activation is a separate decision and was not touched.

## Boundary and evidence

The attempted bundle is [ppocrv6_medium_rec_recipe_runner.py](/Users/hangyukim/Documents/softie_project/tools/ocr/ppocrv6_medium_rec_recipe_runner.py). Its contract is train-only, pinned to the CHI-KNOW-PO train shards and the three inner-dev documents, with no local-path, held-out, frozen-gold, detection, semantic, search, or activation input.

The machine-readable submission evidence is [hf-job-submission-receipt.json](/Users/hangyukim/Documents/softie_project/artifacts/historical-ocr-chi-know-po-medium-rec-recipe-v1/hf-job-submission-receipt.json). It is independently checked by [chiKnowPoMediumRecRecipeSubmission.js](/Users/hangyukim/Documents/softie_project/src/ocr/chiKnowPoMediumRecRecipeSubmission.js). A remote result would be accepted only through [chiKnowPoMediumRecRecipeRun.js](/Users/hangyukim/Documents/softie_project/src/ocr/chiKnowPoMediumRecRecipeRun.js), which requires every checkpoint's metric, document-level, output round-trip, weight round-trip, and resource evidence before a recipe can be proven.

`BLOCK_OCR_ROUTE=true` and `OCRProvider.enabled=false` remain unchanged.
