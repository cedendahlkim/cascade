# Task: gen-dict-char_count-2873 | Score: 100% | 2026-02-13T12:18:22.102288

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))