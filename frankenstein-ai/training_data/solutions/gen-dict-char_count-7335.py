# Task: gen-dict-char_count-7335 | Score: 100% | 2026-02-15T09:02:16.948371

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))