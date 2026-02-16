# Task: gen-dict-char_count-1658 | Score: 100% | 2026-02-14T13:26:03.590241

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))