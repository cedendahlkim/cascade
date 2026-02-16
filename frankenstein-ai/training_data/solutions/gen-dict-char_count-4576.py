# Task: gen-dict-char_count-4576 | Score: 100% | 2026-02-15T08:14:41.348735

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))