# Task: gen-dict-char_count-3764 | Score: 100% | 2026-02-17T19:57:41.307357

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))