# Task: gen-strv-anagram-5416 | Score: 100% | 2026-02-15T12:03:40.329176

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')