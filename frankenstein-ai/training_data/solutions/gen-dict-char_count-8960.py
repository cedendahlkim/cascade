# Task: gen-dict-char_count-8960 | Score: 100% | 2026-02-13T21:48:44.998754

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))