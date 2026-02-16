# Task: gen-strv-anagram-2782 | Score: 100% | 2026-02-15T09:34:00.346201

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')