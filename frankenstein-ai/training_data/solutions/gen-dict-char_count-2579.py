# Task: gen-dict-char_count-2579 | Score: 100% | 2026-02-13T13:10:52.325366

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))