# Task: gen-dict-char_count-8648 | Score: 100% | 2026-02-15T09:35:26.338566

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))