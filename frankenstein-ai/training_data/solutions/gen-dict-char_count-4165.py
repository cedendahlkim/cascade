# Task: gen-dict-char_count-4165 | Score: 100% | 2026-02-13T14:30:13.060755

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))