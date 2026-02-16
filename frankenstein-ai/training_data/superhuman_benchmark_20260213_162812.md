# SUPERHUMAN Benchmark: Frankenstein AI vs Gemini 2.0 Flash

**Datum:** 2026-02-13 16:28:12
**Uppgifter:** 21 (Difficulty 11-13)
**Kategorier:** security_audit, cross_domain, chain_reasoning, devops_debug, massive_scale, adversarial, real_world_auto

## Sammanfattning

| Metrik | Frankenstein AI | Gemini 2.0 Flash | Skillnad |
|---|---|---|---|
| Losta | 19/21 (90%) | 16/21 (76%) | +14.3% |
| First-try | 17 (81%) | 14 (67%) | +14.3% |
| Snitt tid | 14417ms | 21666ms | |

**Frankenstein AI vinner med 14.3% hogre losningsgrad pa SUPERHUMAN-uppgifter!**

## Per kategori (Superhuman)

| Kategori | Niva | Frank | Gemini | Diff |
|---|---|---|---|---|
| adversarial | 11.7 | 2/3 (67%) | 2/3 (67%) | +0% 🤝 |
| chain_reasoning | 11.0 | 3/3 (100%) | 3/3 (100%) | +0% 🤝 |
| cross_domain | 13.0 | 2/3 (67%) | 1/3 (33%) | +33% 🧟 |
| devops_debug | 11.3 | 3/3 (100%) | 3/3 (100%) | +0% 🤝 |
| massive_scale | 11.3 | 3/3 (100%) | 3/3 (100%) | +0% 🤝 |
| real_world_auto | 11.7 | 3/3 (100%) | 1/3 (33%) | +67% 🧟 |
| security_audit | 12.7 | 3/3 (100%) | 3/3 (100%) | +0% 🤝 |

## Svaraste uppgifter

| Uppgift | Niva | Frank | Gemini |
|---|---|---|---|
| Cross-domain: Linjär Regression | 13 | FAIL (0%) | FAIL (0%) |
| Adversarial: Unicode Edge Cases | 11 | FAIL (0%) | FAIL (0%) |
| Cross-domain: Nätverk+Krypto+Math | 13 | OK | FAIL (0%) |
| Automation: JSON→CSV→Aggregering | 12 | OK | FAIL (0%) |
| Automation: JSON→CSV→Aggregering | 12 | OK | FAIL (0%) |
| Kryptoanalys: Hitta svagheter | 13 | OK | OK |
| Kryptoanalys: Hitta svagheter | 13 | OK | OK |
| Cross-domain: Nätverk+Krypto+Math | 13 | OK | OK |
| DevOps: CI/CD Pipeline Debug | 12 | OK | OK |
| Adversarial: Floating-point Precision | 12 | OK | OK |

## Frankenstein Stack Stats

- **HDC Koncept:** 2
- **AIF Exploration:** 0.57
- **Ebbinghaus Minnen:** 30 aktiva / 30 totalt
- **Strategier:** {
  "direct": {
    "attempts": 8,
    "successes": 1
  },
  "with_hints": {
    "attempts": 16,
    "successes": 6
  },
  "from_memory": {
    "attempts": 5,
    "successes": 3
  },
  "step_by_step": {
    "attempts": 2,
    "successes": 1
  },
  "system1_promoted": {
    "attempts": 6,
    "successes": 6
  },
  "with_hints+reflection": {
    "attempts": 0,
    "successes": 4
  }
}
