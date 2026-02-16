# Task: gen-dict-char_count-7916 | Score: 100% | 2026-02-13T11:44:49.830762

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))