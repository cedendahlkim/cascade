# Task: gen-dict-char_count-3849 | Score: 100% | 2026-02-13T21:08:23.776498

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))