# Task: gen-dict-char_count-3476 | Score: 100% | 2026-02-13T18:37:35.060822

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))