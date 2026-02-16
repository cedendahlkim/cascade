# Task: gen-dict-char_count-5449 | Score: 100% | 2026-02-13T20:01:42.683442

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))