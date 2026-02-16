# Task: gen-dict-char_count-9629 | Score: 100% | 2026-02-13T21:07:38.837427

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))