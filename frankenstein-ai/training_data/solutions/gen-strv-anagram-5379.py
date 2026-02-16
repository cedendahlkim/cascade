# Task: gen-strv-anagram-5379 | Score: 100% | 2026-02-15T12:03:39.673526

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')