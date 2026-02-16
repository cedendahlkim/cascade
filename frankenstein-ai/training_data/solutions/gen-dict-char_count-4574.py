# Task: gen-dict-char_count-4574 | Score: 100% | 2026-02-13T20:17:08.198665

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))