# Task: gen-strv-anagram-5604 | Score: 100% | 2026-02-15T10:27:56.091151

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')