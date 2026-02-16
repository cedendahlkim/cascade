# Task: gen-dict-char_count-4568 | Score: 100% | 2026-02-13T17:36:16.235704

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))