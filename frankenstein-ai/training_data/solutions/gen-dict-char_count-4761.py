# Task: gen-dict-char_count-4761 | Score: 100% | 2026-02-13T11:03:58.849032

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))