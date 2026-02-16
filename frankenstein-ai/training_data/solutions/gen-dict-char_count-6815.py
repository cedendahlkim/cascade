# Task: gen-dict-char_count-6815 | Score: 100% | 2026-02-13T13:10:52.023077

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))