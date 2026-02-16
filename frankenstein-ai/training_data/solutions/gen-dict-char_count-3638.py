# Task: gen-dict-char_count-3638 | Score: 100% | 2026-02-15T12:03:36.318653

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))