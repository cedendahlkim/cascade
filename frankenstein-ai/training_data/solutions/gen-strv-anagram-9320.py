# Task: gen-strv-anagram-9320 | Score: 100% | 2026-02-15T12:02:38.359444

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')