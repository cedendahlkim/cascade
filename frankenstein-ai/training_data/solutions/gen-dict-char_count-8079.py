# Task: gen-dict-char_count-8079 | Score: 100% | 2026-02-14T12:02:43.276535

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))