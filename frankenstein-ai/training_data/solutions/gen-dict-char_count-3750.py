# Task: gen-dict-char_count-3750 | Score: 100% | 2026-02-14T13:26:49.017373

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))