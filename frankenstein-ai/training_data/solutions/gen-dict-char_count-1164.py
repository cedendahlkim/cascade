# Task: gen-dict-char_count-1164 | Score: 100% | 2026-02-13T09:33:17.609730

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))