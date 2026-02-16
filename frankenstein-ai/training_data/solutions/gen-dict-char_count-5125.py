# Task: gen-dict-char_count-5125 | Score: 100% | 2026-02-13T17:36:15.894819

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))