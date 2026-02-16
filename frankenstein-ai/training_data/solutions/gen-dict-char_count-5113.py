# Task: gen-dict-char_count-5113 | Score: 100% | 2026-02-13T11:03:13.490591

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))