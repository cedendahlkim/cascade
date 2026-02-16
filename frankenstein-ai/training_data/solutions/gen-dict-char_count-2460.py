# Task: gen-dict-char_count-2460 | Score: 100% | 2026-02-15T08:35:16.957740

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))