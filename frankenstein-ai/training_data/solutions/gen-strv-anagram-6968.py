# Task: gen-strv-anagram-6968 | Score: 100% | 2026-02-13T20:50:04.898055

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')