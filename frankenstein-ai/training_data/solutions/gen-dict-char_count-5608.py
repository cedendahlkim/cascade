# Task: gen-dict-char_count-5608 | Score: 100% | 2026-02-13T20:50:20.305645

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))