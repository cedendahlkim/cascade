# Task: gen-dict-char_count-7413 | Score: 100% | 2026-02-13T16:07:12.292477

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))