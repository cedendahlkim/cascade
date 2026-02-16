# Task: gen-dict-char_count-9292 | Score: 100% | 2026-02-13T11:44:50.221025

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))