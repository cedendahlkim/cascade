# Task: gen-strv-anagram-1444 | Score: 100% | 2026-02-13T12:42:49.999911

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')