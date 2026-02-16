# Task: gen-dict-char_count-8153 | Score: 100% | 2026-02-13T14:42:23.416992

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))