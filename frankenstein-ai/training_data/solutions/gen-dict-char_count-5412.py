# Task: gen-dict-char_count-5412 | Score: 100% | 2026-02-14T12:03:02.455914

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))