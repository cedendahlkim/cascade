# Task: gen-strv-anagram-4918 | Score: 100% | 2026-02-13T18:33:52.838679

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')