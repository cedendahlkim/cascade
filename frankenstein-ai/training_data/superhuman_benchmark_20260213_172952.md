# SUPERHUMAN Benchmark: Frankenstein AI vs Gemini 2.0 Flash

**Datum:** 2026-02-13 17:29:52
**Uppgifter:** 21 (Difficulty 11-14)
**Kategorier:** cross_domain, massive_scale, chain_reasoning, real_world_auto, devops_debug, security_audit, adversarial

## Sammanfattning

| Metrik | Frankenstein AI | Gemini 2.0 Flash | Skillnad |
|---|---|---|---|
| Losta | 21/21 (100%) | 17/21 (81%) | +19.0% |
| First-try | 20 (95%) | 14 (67%) | +28.6% |
| Snitt tid | 5604ms | 11768ms | |

**Frankenstein AI vinner med 19.0% hogre losningsgrad pa SUPERHUMAN-uppgifter!**

## Per kategori (Superhuman)

| Kategori | Niva | Frank | Gemini | Diff |
|---|---|---|---|---|
| adversarial | 13.0 | 3/3 (100%) | 3/3 (100%) | +0% 🤝 |
| chain_reasoning | 11.3 | 3/3 (100%) | 3/3 (100%) | +0% 🤝 |
| cross_domain | 13.0 | 3/3 (100%) | 1/3 (33%) | +67% 🧟 |
| devops_debug | 11.7 | 3/3 (100%) | 3/3 (100%) | +0% 🤝 |
| massive_scale | 11.3 | 3/3 (100%) | 3/3 (100%) | +0% 🤝 |
| real_world_auto | 11.7 | 3/3 (100%) | 1/3 (33%) | +67% 🧟 |
| security_audit | 11.0 | 3/3 (100%) | 3/3 (100%) | +0% 🤝 |

## Svaraste uppgifter

| Uppgift | Niva | Frank | Gemini |
|---|---|---|---|
| Cross-domain: Nätverk+Krypto+Math | 13 | OK | FAIL (0%) |
| Cross-domain: Nätverk+Krypto+Math | 13 | OK | FAIL (0%) |
| Automation: JSON→CSV→Aggregering | 12 | OK | FAIL (0%) |
| Automation: API Retry med Backoff | 12 | OK | FAIL (0%) |
| Adversarial: Race Condition Detector | 14 | OK | OK |
| Adversarial: Race Condition Detector | 14 | OK | OK |
| Cross-domain: Linjär Regression | 13 | OK | OK |
| DevOps: Docker Security Audit | 12 | OK | OK |
| Kedja: Tokenize→Parse→Evaluate | 12 | OK | OK |
| DevOps: Docker Security Audit | 12 | OK | OK |

## Frankenstein Stack Stats

- **HDC Koncept:** 1
- **AIF Exploration:** 0.53
- **Ebbinghaus Minnen:** 24 aktiva / 24 totalt
- **Strategier:** {
  "direct": {
    "attempts": 4,
    "successes": 0
  },
  "with_hints": {
    "attempts": 6,
    "successes": 5
  },
  "from_memory": {
    "attempts": 5,
    "successes": 3
  },
  "step_by_step": {
    "attempts": 2,
    "successes": 1
  },
  "system0_deterministic": {
    "attempts": 9,
    "successes": 9
  },
  "system1_promoted": {
    "attempts": 2,
    "successes": 2
  },
  "step_by_step+reflection": {
    "attempts": 0,
    "successes": 2
  }
}
