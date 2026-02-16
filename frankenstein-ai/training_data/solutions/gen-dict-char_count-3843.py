# Task: gen-dict-char_count-3843 | Score: 100% | 2026-02-13T10:39:36.608858

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))