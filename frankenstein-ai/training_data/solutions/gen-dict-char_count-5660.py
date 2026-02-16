# Task: gen-dict-char_count-5660 | Score: 100% | 2026-02-13T11:33:43.284477

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))