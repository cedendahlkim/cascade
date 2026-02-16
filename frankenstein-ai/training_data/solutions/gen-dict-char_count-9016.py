# Task: gen-dict-char_count-9016 | Score: 100% | 2026-02-13T21:48:53.163696

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))