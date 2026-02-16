# Task: gen-dict-char_count-7836 | Score: 100% | 2026-02-13T14:30:12.044868

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))