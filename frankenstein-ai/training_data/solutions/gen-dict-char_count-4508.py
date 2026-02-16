# Task: gen-dict-char_count-4508 | Score: 100% | 2026-02-13T12:04:15.126007

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))