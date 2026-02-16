# Task: gen-dict-char_count-8641 | Score: 100% | 2026-02-15T10:09:31.878366

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))